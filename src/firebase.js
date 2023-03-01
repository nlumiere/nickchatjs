import { initializeApp} from "firebase/app";
import "firebase/firestore";
import { addDoc, collection, doc, getDoc, getFirestore, onSnapshot, setDoc } from "firebase/firestore";

const firebaseConfig = {

  apiKey: "AIzaSyCSE9x7W0FbmRhVUmsA6gKo6AsZZ5j2fXw",
  authDomain: "nickchat-5564f.firebaseapp.com",
  projectId: "nickchat-5564f",
  storageBucket: "nickchat-5564f.appspot.com",
  messagingSenderId: "365707028861",
  appId: "1:365707028861:web:a557e9be2d3bf0b37d0414",
  measurementId: "G-CVQS4P90F3"
};


const app = initializeApp(firebaseConfig);

const firestore = getFirestore(app);

async function call(pc) {
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type
  }

  const callsRef = collection(firestore, 'calls');
  const docRef = await addDoc((callsRef), {offer: offer});
  const offerCandidates = collection(firestore, 'calls/' + docRef.id + '/offerCandidates');
  const answerCandidates = collection(firestore, 'calls/' + docRef.id + '/answerCandidates');

  const callId = docRef.id;
  console.log(callId);

  pc.onicecandidate = async event => {
    event.candidate && await addDoc(offerCandidates, event.candidate.toJSON());
  }

  onSnapshot(docRef, (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);
      }
    });
  });
}

async function answerCall(pc, callId) {
  const callRef = doc(firestore, 'calls', callId);
  const callDoc = await getDoc(callRef);
  const offerCandidates = collection(firestore, 'calls/' + callId + '/offerCandidates');
  const answerCandidates = collection(firestore, 'calls/' + callId + '/answerCandidates');

  pc.onicecandidate = async event => {
    event.candidate && await addDoc(answerCandidates, event.candidate.toJSON());
  };

  const callData = callDoc.data();

  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  callData['answer'] = answer;

  await setDoc((callRef), callData);

  onSnapshot(offerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      console.log(change);
      if (change.type === 'added') {
        const data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });
}

export { call, answerCall }