const functions = require('firebase-functions')
const admin = require('firebase-admin');
const { firestore } = require('firebase-admin');
admin.initializeApp()

exports.sendNotification = functions.firestore
  .document('conversations/{groupId1}/{groupId2}/{message}')
  .onCreate((snap, context) => {
    console.log('----------------start function--------------------')

    const doc = snap.data()
    console.log(doc)

    const idFrom = doc.idFrom
    const idTo = doc.idTo
    const contentMessage = doc.content;
    const chatId = context.params.groupId1;

    // Get push token user to (receive)
    admin
      .firestore()
      .collection('users')
      .where(admin.firestore.FieldPath.documentId(), '==', idTo)
      .get()
      .then(querySnapshot => {
        querySnapshot.forEach(userTo => {
          console.log(`Found user to: ${userTo.data().name}`)
          if (userTo.data().pushToken && userTo.data().chattingWith !== idFrom) {
            // Get info user from (sent)
            admin
              .firestore()
              .collection('users')
              .where(admin.firestore.FieldPath.documentId(), '==', idFrom)
              .get()
              .then(querySnapshot2 => {
                querySnapshot2.forEach(userFrom => {
                  console.log(`Found user from: ${userFrom.data().name}`)
                  const payload = {
                    notification: {
                      title: `You have a message from "${userFrom.data().name}"`,
                      body: contentMessage,
                      badge: '1',
                      sound: 'default'
                    },
                    data: {
                      'click_action': "FLUTTER_NOTIFICATION_CLICK",
                      "msgText": doc.content,
                      "fromId": doc.idFrom,
                      "toId": doc.idTo,
                      'fromUser': userFrom.data().name,
                      'chatId': chatId
                    }
                  }
                  // Let push to the target device
                  admin
                    .messaging()
                    .sendToDevice(userTo.data().pushToken, payload)
                    .then(response => {
                      console.log('Successfully sent message:', response)
                    })
                    .catch(error => {
                      console.log('Error sending message:', error)
                    })
                })
              })
          } else {
            console.log('Can not find pushToken target user')
          }
        })
      })
    return null
  });