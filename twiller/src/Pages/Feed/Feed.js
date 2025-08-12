import React, { useEffect, useMemo, useRef, useState } from "react";
import "./Feed.css";
import Posts from "./Posts/Posts";
import Tweetbox from "./Tweetbox/Tweetbox";
import useLoggedinuser from "../../hooks/useLoggedinuser";
import { useNotification } from "../../context/NotificationContext";

const Feed = () => {
  const [post, setpost] = useState([]);
  const [loggedinuser] = useLoggedinuser();
  const { checkAndNotify } = useNotification();
  const notifiedIdsRef = useRef(new Set());

  useEffect(() => {
    fetch("http://localhost:5000/post")
      .then((res) => res.json())
      .then((data) => {
        setpost(data);
      });
  }, []);

  // Poll for new posts periodically
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:5000/post")
        .then((res) => res.json())
        .then((data) => {
          setpost(data);
        });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // Check for new tweets with keywords and show notifications
  useEffect(() => {
    for (const tweet of post) {
      const tweetId = tweet._id || `${tweet.email}-${tweet.post}`;
      
      // Skip if we've already notified about this tweet
      if (notifiedIdsRef.current.has(tweetId)) {
        continue;
      }

      // Check if tweet contains keywords and show notification
      if (checkAndNotify(tweet)) {
        notifiedIdsRef.current.add(tweetId);
      }
    }
  }, [post, checkAndNotify]);

  return (
    <div className="feed">
      <div className="feed__header">
        <h2>Home</h2>
      </div>
      <Tweetbox />
      {post.map((p) => (
        <Posts key={p._id} p={p} />
      ))}
    </div>
  );
};

export default Feed;
