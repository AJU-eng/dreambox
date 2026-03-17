import React, { useRef, useEffect } from "react";

function App() {

  const localVideo = useRef(null);
  const remoteVideo = useRef(null);

  const socket = useRef(null);
  const peerConnection = useRef(null);

  // 🔥 ROLE (IMPORTANT)
  const isCaller = window.location.hash === "#caller";

  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }
    ]
  };

  useEffect(() => {

    socket.current = new WebSocket("wss://4b03-103-146-175-155.ngrok-free.app/ws");

    socket.current.onmessage = async (message) => {
      const data = JSON.parse(message.data);

      console.log("SIGNAL STATE:", peerConnection.current?.signalingState);
      console.log("RECEIVED:", data);

      // 🟢 HANDLE OFFER (only receiver)
      if (data.offer && !isCaller) {

        if (peerConnection.current.signalingState !== "stable") return;

        await peerConnection.current.setRemoteDescription(data.offer);

        const answer = await peerConnection.current.createAnswer();
        await peerConnection.current.setLocalDescription(answer);

        socket.current.send(JSON.stringify({ answer }));
      }

      // 🔵 HANDLE ANSWER (only caller)
      if (data.answer && isCaller) {

        if (peerConnection.current.signalingState !== "have-local-offer") return;

        await peerConnection.current.setRemoteDescription(data.answer);
      }

      // 🟡 HANDLE ICE (both)
      if (data.iceCandidate) {
        try {
          await peerConnection.current.addIceCandidate(data.iceCandidate);
        } catch (e) {
          console.error("ICE error:", e);
        }
      }
    };

    startCamera();

  }, []);

  const startCamera = async () => {

    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    localVideo.current.srcObject = stream;

    peerConnection.current = new RTCPeerConnection(configuration);

    // 🔍 Debug signaling state
    peerConnection.current.onsignalingstatechange = () => {
      console.log("STATE:", peerConnection.current.signalingState);
    };

    stream.getTracks().forEach(track => {
      peerConnection.current.addTrack(track, stream);
    });

    peerConnection.current.ontrack = event => {
      remoteVideo.current.srcObject = event.streams[0];
    };

    peerConnection.current.onicecandidate = event => {
      if (event.candidate) {
        socket.current.send(JSON.stringify({
          iceCandidate: event.candidate
        }));
      }
    };
  };

  const createOffer = async () => {

    if (!isCaller) {
      console.log("Only caller can create offer");
      return;
    }

    if (peerConnection.current.signalingState !== "stable") {
      console.log("Not ready to create offer");
      return;
    }

    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);

    socket.current.send(JSON.stringify({ offer }));
  };

  return (
    <div>

      <h2>WebRTC Video Call</h2>
      <h4>{isCaller ? "Caller" : "Receiver"}</h4>

      <video ref={localVideo} autoPlay playsInline width="300" />

      <video ref={remoteVideo} autoPlay playsInline width="300" />

      <br />

      <button onClick={createOffer} disabled={!isCaller}>
        Start Call
      </button>

    </div>
  );
}

export default App;