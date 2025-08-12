import React, { useState, useEffect } from "react";
import Post from "../Posts/posts";
import { useNavigate } from "react-router-dom";
import "./Mainprofile.css";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CenterFocusWeakIcon from "@mui/icons-material/CenterFocusWeak";
import LockResetIcon from "@mui/icons-material/LockReset";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import AddLinkIcon from "@mui/icons-material/AddLink";
import NotificationsIcon from "@mui/icons-material/Notifications";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import Editprofile from "../Editprofile/Editprofile";
import axios from "axios";
import useLoggedinuser from "../../../hooks/useLoggedinuser";
import { useNotification } from "../../../context/NotificationContext";

const Mainprofile = ({ user }) => {
  const navigate = useNavigate();
  const [isloading, setisloading] = useState(false);
  const [loggedinuser] = useLoggedinuser();
  const username = user?.email?.split("@")[0];
  const [post, setpost] = useState([]);
  
  const {
    notificationsEnabled,
    setNotificationsEnabled,
    notificationPermission,
    requestNotificationPermission,
    canEnableNotifications,
    testNotificationSystem
  } = useNotification();

  useEffect(() => {
    fetch(`http://localhost:5000/userpost?email=${user?.email}`)
      .then((res) => res.json())
      .then((data) => {
        setpost(data);
      });
  }, [user.email]);

  // Sync local toggle state with server-provided user data
  useEffect(() => {
    const enabled = !!loggedinuser[0]?.notificationsEnabled;
    setNotificationsEnabled(enabled);
  }, [loggedinuser, setNotificationsEnabled]);

  const updateNotificationPreference = async (enable) => {
    try {
      const body = { email: user?.email, notificationsEnabled: enable };
      await fetch(`http://localhost:5000/userupdate/${user?.email}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch (e) {
      console.log(e);
      window.alert("Failed to update notification preference");
    }
  };

  const handleToggleNotifications = async (e) => {
    const enable = e.target.checked;
    
    if (enable) {
      try {
        const permission = await requestNotificationPermission();
        if (permission !== "granted") {
          window.alert("Notification permission was not granted. Please enable notifications in your browser settings.");
          setNotificationsEnabled(false);
          return;
        }
      } catch (err) {
        console.log(err);
        window.alert("Failed to request notification permission. Please check your browser settings.");
        setNotificationsEnabled(false);
        return;
      }
    }
    
    setNotificationsEnabled(enable);
    updateNotificationPreference(enable);
  };

  const getNotificationStatusText = () => {
    if (!("Notification" in window)) {
      return "Notifications not supported in this browser";
    }
    
    if (notificationPermission === "denied") {
      return "Notifications blocked. Please enable in browser settings.";
    }
    
    if (notificationPermission === "default") {
      return "Click to enable notifications";
    }
    
    return "Notifications enabled";
  };

  const getNotificationStatusIcon = () => {
    if (notificationsEnabled && notificationPermission === "granted") {
      return <NotificationsIcon style={{ color: "#1DA1F2" }} />;
    }
    return <NotificationsOffIcon style={{ color: "#657786" }} />;
  };

  const handleuploadcoverimage = (e) => {
    setisloading(true);
    const image = e.target.files[0];
    // console.log(image)
    const formData = new FormData();
    formData.set("image", image);
    axios
      .post(
        "https://api.imgbb.com/1/upload?key=b0ea2f6cc0f276633b2a8a86d2c43335",
        formData
      )
      .then((res) => {
        const url = res.data.data.display_url;
        // console.log(res.data.data.display_url);
        const usercoverimage = {
          email: user?.email,
          coverimage: url,
        };
        setisloading(false);
        if (url) {
          fetch(`http://localhost:5000/userupdate/${user?.email}`, {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(usercoverimage),
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("done", data);
            });
        }
      })
      .catch((e) => {
        console.log(e);
        window.alert(e);
        setisloading(false);
      });
  };
  const handleuploadprofileimage = (e) => {
    setisloading(true);
    const image = e.target.files[0];
    // console.log(image)
    const formData = new FormData();
    formData.set("image", image);
    axios
      .post(
        "https://api.imgbb.com/1/upload?key=b0ea2f6cc0f276633b2a8a86d2c43335",
        formData
      )
      .then((res) => {
        const url = res.data.data.display_url;
        // console.log(res.data.data.display_url);
        const userprofileimage = {
          email: user?.email,
          profileImage: url,
        };
        setisloading(false);
        if (url) {
          fetch(`http://localhost:5000/userupdate/${user?.email}`, {
            method: "PATCH",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify(userprofileimage),
          })
            .then((res) => res.json())
            .then((data) => {
              console.log("done", data);
            });
        }
      })
      .catch((e) => {
        console.log(e);
        window.alert(e);
        setisloading(false);
      });
  };
  // const data = [
  //   {
  //     _id: "1",
  //     name: "Jane Doe",
  //     username: "jane_doe",
  //     profilePhoto: "https://example.com/profiles/jane.jpg",
  //     post: "Exploring the new features in JavaScript! 🚀 #coding #JavaScript",
  //     photo: "https://example.com/posts/javascript.png",
  //   },
  //   {
  //     _id: "2",
  //     name: "John Smith",
  //     username: "johnsmith",
  //     profilePhoto: "https://example.com/profiles/john.jpg",
  //     post: "Just finished a great workout session! 💪 #fitness #health",
  //     photo: "https://example.com/posts/workout.png",
  //   },
  //   {
  //     _id: "3",
  //     name: "Alice Johnson",
  //     username: "alicejohnson",
  //     profilePhoto: "https://example.com/profiles/alice.jpg",
  //     post: "Loving the new features in CSS! #webdevelopment #design",
  //     photo: "https://example.com/posts/css.png",
  //   },
  // ];
  return (
    <div>
      <ArrowBackIcon className="arrow-icon" onClick={() => navigate("/")} />
      <h4 className="heading-4">{username}</h4>
      <div className="mainprofile">
        <div className="profile-bio">
          {
            <div>
              <div className="coverImageContainer">
                <img
                  src={
                    loggedinuser[0]?.coverimage
                      ? loggedinuser[0].coverimage
                      : user && user.photoURL
                  }
                  alt=""
                  className="coverImage"
                />
                <div className="hoverCoverImage">
                  <div className="imageIcon_tweetButton">
                    <label htmlFor="image" className="imageIcon">
                      {isloading ? (
                        <LockResetIcon className="photoIcon photoIconDisabled" />
                      ) : (
                        <CenterFocusWeakIcon className="photoIcon" />
                      )}
                    </label>
                    <input
                      type="file"
                      id="image"
                      className="imageInput"
                      onChange={handleuploadcoverimage}
                    />
                  </div>
                </div>
              </div>
              <div className="avatar-img">
                <div className="avatarContainer">
                  <img
                    src={
                      loggedinuser[0]?.profileImage
                        ? loggedinuser[0].profileImage
                        : user && user.photoURL
                    }
                    alt=""
                    className="avatar"
                  />
                  <div className="hoverAvatarImage">
                    <div className="imageIcon_tweetButton">
                      <label htmlFor="profileImage" className="imageIcon">
                        {isloading ? (
                          <LockResetIcon className="photoIcon photoIconDisabled" />
                        ) : (
                          <CenterFocusWeakIcon className="photoIcon" />
                        )}
                      </label>
                      <input
                        type="file"
                        id="profileImage"
                        className="imageInput"
                        onChange={handleuploadprofileimage}
                      />
                    </div>
                  </div>
                </div>
                <div className="userInfo">
                  <div>
                    <h3 className="heading-3">
                      {loggedinuser[0]?.name
                        ? loggedinuser[0].name
                        : user && user.displayname}
                    </h3>
                    <p className="usernameSection">@{username}</p>
                  </div>
                  <Editprofile user={user} loggedinuser={loggedinuser} />
                </div>
                <div className="infoContainer" style={{ marginTop: "8px" }}>
                  <div className="notification-controls">
                    <label 
                      style={{ 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "12px", 
                        cursor: canEnableNotifications() ? "pointer" : "not-allowed",
                        padding: "12px",
                        border: "1px solid #e1e8ed",
                        borderRadius: "8px",
                        backgroundColor: notificationsEnabled ? "#f7f9fa" : "#ffffff",
                        opacity: canEnableNotifications() ? 1 : 0.6
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={notificationsEnabled}
                        onChange={handleToggleNotifications}
                        disabled={!canEnableNotifications()}
                      />
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {getNotificationStatusIcon()}
                        <span style={{ fontWeight: "500" }}>
                          Tweet Notifications
                        </span>
                      </div>
                    </label>
                    <div style={{ 
                      marginTop: "8px", 
                      fontSize: "14px", 
                      color: "#657786",
                      paddingLeft: "4px"
                    }}>
                      <p style={{ margin: "4px 0" }}>
                        Get notified when tweets contain keywords: <strong>cricket</strong> or <strong>science</strong>
                      </p>
                      <p style={{ margin: "4px 0", fontStyle: "italic" }}>
                        {getNotificationStatusText()}
                      </p>
                      {!canEnableNotifications() && (
                        <p style={{ 
                          margin: "8px 0", 
                          color: "#e0245e", 
                          fontWeight: "500",
                          padding: "8px 12px",
                          backgroundColor: "#fef0f3",
                          borderRadius: "6px",
                          borderLeft: "3px solid #e0245e"
                        }}>
                          ⚠️ Notifications are blocked. Please enable them in your browser settings.
                        </p>
                      )}
                      {notificationPermission === "granted" && (
                        <button
                          onClick={() => {
                            testNotificationSystem();
                          }}
                          style={{
                            marginTop: "8px",
                            padding: "8px 16px",
                            backgroundColor: "#1DA1F2",
                            color: "white",
                            border: "none",
                            borderRadius: "20px",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: "500"
                          }}
                        >
                          Test Notification
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <div className="infoContainer">
                  {loggedinuser[0]?.bio ? <p>{loggedinuser[0].bio}</p> : ""}
                  <div className="locationAndLink">
                    {loggedinuser[0]?.location ? (
                      <p className="suvInfo">
                        <MyLocationIcon /> {loggedinuser[0].location}
                      </p>
                    ) : (
                      ""
                    )}
                    {loggedinuser[0]?.website ? (
                      <p className="subInfo link">
                        <AddLinkIcon /> {loggedinuser[0].website}
                      </p>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <h4 className="tweetsText">Tweets</h4>
                <hr />
              </div>
              {post.map((p) => (
                <Post p={p} />
              ))}
            </div>
          }
        </div>
      </div>
    </div>
  );
};

export default Mainprofile;
