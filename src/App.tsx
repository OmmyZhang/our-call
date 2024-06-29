import {
  LocalUser,
  RemoteUser,
  useJoin,
  useLocalMicrophoneTrack,
  useLocalCameraTrack,
  usePublish,
  useRemoteUsers,
} from "agora-rtc-react";
import { useState } from "react";
import { gen_app_id } from "./tools";
import Mao from "./assets/mao.png";
import Ji from "./assets/ji.png";
import "./styles.scss";


export const Basics = () => {
  const [calling, setCalling] = useState(false);
  const [appId, setAppId] = useState("");
  const [channel, setChannel] = useState("123");
  const realAppId = calling ? gen_app_id(appId) : "";
  const join = useJoin({ appid: realAppId, channel: channel, token: null }, calling);
  //local user
  const [micOn, setMic] = useState(true);
  const [cameraOn, setCamera] = useState(true);
  const { localMicrophoneTrack } = useLocalMicrophoneTrack(micOn);
  const { localCameraTrack } = useLocalCameraTrack(cameraOn);
  //remote users
  const remoteUsers = useRemoteUsers();

  const [mainUser, setMainUser] = useState<number | string | null>(null);

  usePublish([localMicrophoneTrack, localCameraTrack]);

  return (
    <div className="our-call"> 
      <div className="header">OUR CALL</div>

      { join.isConnected ? (
        <div className="room">
          <div className={`user-list ${mainUser === null ? '' : 'withMain'}`}>
            <div
              className={`user ${mainUser === 0 ? 'main' : 'side'}`}
              onClick={ () => setMainUser(mainUser == 0 ? null : 0)}
            >
              <LocalUser
                cameraOn={ cameraOn }
                micOn={ micOn }
                videoTrack={ localCameraTrack }
                cover={ Ji }
              >
                <samp className="user-name">You</samp>
              </LocalUser>
            </div>
            { remoteUsers.map((user) => {
              return (
                <div
                  className={`user ${mainUser === user.uid ? 'main' : 'side'}`}
                  key={ user.uid }
                  onClick={ () => setMainUser(mainUser == user.uid ? null : user.uid)}
                >
                  <RemoteUser cover={ Mao } user={ user }>
                  </RemoteUser>
                </div>
              )
            }) }
          </div>
          <div className="control">
            <div className="left-control">
              <div onClick={ () => setMic(a => !a) } className={ `microphone ${ !micOn ? "off" : "" }` } />
              <div onClick={ () => setCamera(a => !a) } className={ `camera ${ !cameraOn ? "off" : "" }` } />
            </div>

            <div onClick={ () => setCalling(a => !a) } className={ `phone ${ !calling ? "off" : "" }` } />
          </div>
        </div>

      ) : (
        <div className="join">
          <div className="input">
            <label>CHANNEL</label>
            <input
              onChange={ e => setChannel(e.target.value) }
              placeholder="Your channel Name"
              value={ channel }
            />
          </div>
          <div className="input">
            <label>KEY
            </label>
            <input
              onKeyDown={ (e) => {
                if (e.key === "Enter") {
                  setCalling(true);
                  e.stopPropagation();
                }
              } }
              onChange={ e => {
                setCalling(false);
                setAppId(e.target.value)
              } }
              placeholder="请输入密钥"
              value={ appId }
            />
          </div>
          <button
            className={ `join-channel ${ !appId || !channel ? "disabled" : "" }` }
            disabled={ !appId || !channel || calling }
            onClick={ () => setCalling(true) }
          >
            <span>    {
              !calling ? "芝麻开门！" :
                join.isLoading ? "芝麻努力开门 ing" : join.error ? "密钥有误" : "?"
            }</span>
          </button>
        </div>
      ) }
    </div>
  );
};

export default Basics;

