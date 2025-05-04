const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');
const path = require('path');

async function testFirestore() {
  try {
    const serviceAccountPath = path.resolve(__dirname, 'zinc-crow-394412-0dfeaff3dcd5.json');
    initializeApp({
      credential: cert(serviceAccountPath),
    });

    const db = getFirestore();

    // Test writing a document
    const docRef = db.collection('testCollection').doc('testDoc');
    await docRef.set({
      testField: 'testValue',
      createdAt: Timestamp.now(),
    });

    // Test reading the document
    const doc = await docRef.get();
    if (doc.exists) {
      console.log('Test document data:', doc.data());
    } else {
      console.log('No such document!');
    }

    console.log('Firestore test completed successfully.');
  } catch (error) {
    console.error('Error testing Firestore:', error);
  }
}

testFirestore();



