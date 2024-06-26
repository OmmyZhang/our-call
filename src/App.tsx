import { useRef, useState } from "react";
import "./App.css";
import type {
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
} from "agora-rtc-sdk-ng/esm";

import {
  VERSION,
  createClient,
  createCameraVideoTrack,
  createMicrophoneAudioTrack,
  onCameraChanged,
  onMicrophoneChanged
} from "agora-rtc-sdk-ng/esm"

console.log("Current SDK VERSION: ", VERSION);

const CTEXT = "5634944c8a88556f84e824bf36fcf12a";
const coder = new TextEncoder();

function gen_app_id(s: string) {
  const ctext = CTEXT.split("");

  const parray = coder.encode(s);

  return Array.from({ length: 32 }, (_, i) => {
    const p = parray[i] ? parray[i] % ctext.length : 0;
    const x = ctext[p];
    ctext.splice(p, 1);
    return x;
  }).join("");
}


onCameraChanged((device) => {
  console.log("onCameraChanged: ", device);
})
onMicrophoneChanged((device) => {
  console.log("onMicrophoneChanged: ", device);
})

const client: IAgoraRTCClient = createClient({
  mode: "rtc",
  codec: "vp8",
});
let audioTrack: IMicrophoneAudioTrack;
let videoTrack: ICameraVideoTrack;
function App() {
  const [isAudioOn, setIsAudioOn] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isAudioPubed, setIsAudioPubed] = useState(false);
  const [isVideoPubed, setIsVideoPubed] = useState(false);
  const [isVideoSubed, setIsVideoSubed] = useState(false);

  const turnOnCamera = async (flag?: boolean) => {
    flag = flag ?? !isVideoOn;
    setIsVideoOn(flag);

    if (videoTrack) {
      return videoTrack.setEnabled(flag);
    }
    videoTrack = await createCameraVideoTrack();
    videoTrack.play("camera-video");
  };

  const turnOnMicrophone = async (flag?: boolean) => {
    flag = flag ?? !isAudioOn;
    setIsAudioOn(flag);

    if (audioTrack) {
      return audioTrack.setEnabled(flag);
    }

    audioTrack = await createMicrophoneAudioTrack();
    // audioTrack.play();
  };

  const [isJoined, setIsJoined] = useState(false);
  const channel = useRef("123");
  const appid_passwd = useRef("");

  const joinChannel = async () => {
    if (!channel.current) {
      channel.current = "react-room";
    }

    if (isJoined) {
      await leaveChannel();
    }

    client.on("user-published", onUserPublish);

    await client.join(
      gen_app_id(appid_passwd.current),
      channel.current,
      null,
      null
    );
    setIsJoined(true);
  };

  const leaveChannel = async () => {
    setIsJoined(false);
    setIsAudioPubed(false);
    setIsVideoPubed(false);

    await client.leave();
  };

  const onUserPublish = async (
    user: IAgoraRTCRemoteUser,
    mediaType: "video" | "audio"
  ) => {
    if (mediaType === "video") {
      const remoteTrack = await client.subscribe(user, mediaType);
      remoteTrack.play("remote-video");
      setIsVideoSubed(true);
    }
    if (mediaType === "audio") {
      const remoteTrack = await client.subscribe(user, mediaType);
      remoteTrack.play();
    }
  };

  const publishVideo = async () => {
    await turnOnCamera(true);

    if (!isJoined) {
      await joinChannel();
    }
    await client.publish(videoTrack);
    setIsVideoPubed(true);
  };

  const publishAudio = async () => {
    await turnOnMicrophone(true);

    if (!isJoined) {
      await joinChannel();
    }

    await client.publish(audioTrack);
    setIsAudioPubed(true);
  };

  return (
    <>
      <div className="left-side">
        <h3>Pleat check you camera / microphone!</h3>
        <div className="buttons">
          <button
            onClick={() => turnOnCamera()}
            className={isVideoOn ? "button-on" : ""}
          >
            Turn {isVideoOn ? "off" : "on"} camera
          </button>
          <button
            onClick={() => turnOnMicrophone()}
            className={isAudioOn ? "button-on" : ""}
          >
            Turn {isAudioOn ? "off" : "on"} Microphone
          </button>
        </div>
        <input
          defaultValue={appid_passwd.current}
          placeholder="芝麻开门!"
          onChange={(e) => (appid_passwd.current = e.target.value)}
        />
        <br />
        <input
          defaultValue={channel.current}
          placeholder="Channel name"
          onChange={(e) => (channel.current = e.target.value)}
        />
        <div className="buttons">
          <button onClick={joinChannel} className={isJoined ? "button-on" : ""}>
            Join Channel
          </button>
          <button
            onClick={publishVideo}
            className={isVideoPubed ? "button-on" : ""}
          >
            Publish Video
          </button>
          <button
            onClick={publishAudio}
            className={isAudioPubed ? "button-on" : ""}
          >
            Publish Audio
          </button>
          <button onClick={leaveChannel}>Leave Channel</button>
        </div>
      </div>
      <div className="right-side">
        <video id="camera-video" hidden={isVideoOn ? false : true}></video>
        <video id="remote-video" hidden={isVideoSubed ? false : true}></video>
        {isJoined && !isVideoSubed ? (
          <div className="waiting">
            You can shared channel {channel.current} to others.....
          </div>
        ) : null}
      </div>
    </>
  );
}

export default App;
