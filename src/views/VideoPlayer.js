import React, {useState, useRef} from 'react';
import Box from '@mui/material/Box';
// import Grid from '@mui/material/Grid';
// import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import { call, answerCall } from '../firebase';

import { Field, Form } from 'react-final-form';

function VideoPlayer() {
    const servers = {
        iceServers: [
            {
                urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.1.google.com:19302']
            }
        ],
        iceCandidatePoolSize: 10,
    };  
    
    let pc = new RTCPeerConnection(servers);
    const [userMedia, setUserMedia] = useState(null);
    const [remoteMedia, setRemoteMedia] = useState(null);

    const localVideo = useRef();
    const remoteVideo = useRef();
    const handleMediaClick = async (event) => {
        console.log(event);
        setUserMedia(await navigator.mediaDevices.getUserMedia({ video: true, audio: true }));
        setRemoteMedia(new MediaStream());
    }

    const handleClickLocal = (event) => {
        console.log("HI")
        if (!userMedia) {
            return;
        }
        console.log(userMedia);

        userMedia.getTracks().forEach((track) => {
            pc.addTrack(track, userMedia);
        })

        pc.ontrack = (event) => {
            console.log("HERE");
            event.streams[0].getTracks().forEach(track => {
                remoteMedia.addTrack(track);
            });
        };

        localVideo.current.srcObject = userMedia;
        remoteVideo.current.srcObject = remoteMedia;
        
        call(pc);
    };

    const handleJoinCall = (callId) => {
        userMedia.getTracks().forEach((track) => {
            pc.addTrack(track, userMedia);
        })

        pc.ontrack = (event) => {
            console.log("HERE");
            event.streams[0].getTracks().forEach(track => {
                remoteMedia.addTrack(track);
            });
        };

        localVideo.current.srcObject = userMedia;
        remoteVideo.current.srcObject = remoteMedia;

        const callIdSlug = callId;
        answerCall(pc, callIdSlug);
    }

    const handleSubmit = async (data) => {
        handleJoinCall(data.callId)
    } 

    return (
        <div className='VideoPlayer'>
            <div className='localVideoWrapper'>
                {(!userMedia) ? <></> : <video id="localVideo" muted ref={localVideo} autoPlay playsInline /> }
            </div>
            <div className='remoteVideoWrapper'>
                {(!remoteMedia) ? <></> : <video id="remoteVideo" ref={remoteVideo} autoPlay playsInline /> }
            </div>
            <Button onClick={handleClickLocal}>Call</Button>
            {(userMedia) ? <></> : <Button onClick={handleMediaClick}>Enable Video</Button>}
            < br />
            <Form
                onSubmit={handleSubmit}
                render={({handleSubmit: handleSubmit2, reset}) => (
                    <Box component="form" onSubmit={(event) => handleSubmit2(event).then(reset)}>
                        <Field name="callId" component="input" type="text" placeholder="BJEEmbpliON2NELacSaZ"/>
                        <Button type="submit">Join Call</Button>
                    </Box>
                )}
            />
        </div>
    );
}

export default VideoPlayer;