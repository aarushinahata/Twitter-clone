import React, { useState, useEffect } from "react";
import "./PublicSpace.css";
import { useUserAuth } from "../../context/UserAuthContext";
import useLoggedinuser from "../../hooks/useLoggedinuser";

const PublicSpace = () => {
  const { user } = useUserAuth();
  const [loggedinuser] = useLoggedinuser();
  const [posts, setPosts] = useState([]);
  const [newPost, setNewPost] = useState("");
  const [userStats, setUserStats] = useState(null);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPosts();
    fetchUserStats();
    fetchFollowers();
    fetchFollowing();
    fetchAllUsers();
  }, [user?.email]);

  const fetchPosts = async () => {
    try {
      const response = await fetch("http://localhost:5000/publicspace/posts");
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error("Error fetching posts:", error);
    }
  };

  const fetchUserStats = async () => {
    if (!user?.email) return;
    try {
      const response = await fetch(`http://localhost:5000/publicspace/userstats/${user.email}`);
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const fetchFollowers = async () => {
    if (!user?.email) return;
    try {
      const response = await fetch(`http://localhost:5000/followers/${user.email}`);
      const data = await response.json();
      setFollowers(data);
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  };

  const fetchFollowing = async () => {
    if (!user?.email) return;
    try {
      const response = await fetch(`http://localhost:5000/following/${user.email}`);
      const data = await response.json();
      setFollowing(data);
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await fetch("http://localhost:5000/user");
      const data = await response.json();
      setAllUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handlePost = async (e) => {
    e.preventDefault();
    if (!newPost.trim()) return;

    setLoading(true);
    setError("");

    try {
      const postData = {
        email: user.email,
        name: loggedinuser[0]?.name || user.displayName || "Unknown User",
        username: user.email.split("@")[0],
        post: newPost,
        timestamp: new Date(),
        profilephoto: loggedinuser[0]?.profileImage || user.photoURL
      };

      const response = await fetch("http://localhost:5000/publicspace/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (response.ok) {
        const result = await response.json();
        setNewPost("");
        fetchPosts();
        fetchUserStats();
        setError("");
      } else {
        const errorData = await response.json();
        setError(errorData.reason || "Failed to post");
      }
    } catch (error) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userToFollow) => {
    try {
      const response = await fetch("http://localhost:5000/follow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          follower: user.email,
          following: userToFollow.email,
        }),
      });

      if (response.ok) {
        fetchFollowers();
        fetchFollowing();
        fetchUserStats();
      }
    } catch (error) {
      console.error("Error following user:", error);
    }
  };

  const handleUnfollow = async (userToUnfollow) => {
    try {
      const response = await fetch("http://localhost:5000/unfollow", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          follower: user.email,
          following: userToUnfollow.email,
        }),
      });

      if (response.ok) {
        fetchFollowers();
        fetchFollowing();
        fetchUserStats();
      }
    } catch (error) {
      console.error("Error unfollowing user:", error);
    }
  };

  const isFollowing = (userEmail) => {
    return following.some(f => f.following === userEmail);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
    return istTime.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPostingStatus = () => {
    if (!userStats) return "Loading...";
    
    if (userStats.canPost) {
      return "✅ You can post now!";
    } else {
      if (userStats.followers === 0) {
        return "⏰ You can only post between 10:00 AM - 10:30 AM IST";
      } else {
        return "📝 Daily posting limit reached";
      }
    }
  };

  return (
    <div className="publicspace">
      <div className="publicspace__header">
        <h2>🌍 Public Space</h2>
        <p className="current-time">Current Time (IST): {getCurrentTime()}</p>
      </div>

      {/* User Stats Section */}
      {userStats && (
        <div className="user-stats">
          <div className="stat-card">
            <h3>📊 Your Stats</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Followers:</span>
                <span className="stat-value">{userStats.followers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Today's Posts:</span>
                <span className="stat-value">{userStats.todayPosts}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Can Post:</span>
                <span className="stat-value">{userStats.canPost ? "Yes" : "No"}</span>
              </div>
            </div>
            <div className="posting-rules">
              <h4>📋 Posting Rules:</h4>
              <ul>
                <li><strong>0 followers:</strong> 1 post per day (10:00 AM - 10:30 AM IST only)</li>
                <li><strong>2+ followers:</strong> 2 posts per day</li>
                <li><strong>10+ followers:</strong> Unlimited posts per day</li>
              </ul>
            </div>
            <div className="posting-status">
              <strong>Status:</strong> {getPostingStatus()}
            </div>
          </div>
        </div>
      )}

      {/* Create Post Section */}
      <div className="create-post-section">
        <h3>✍️ Create Post</h3>
        <form onSubmit={handlePost} className="post-form">
          <textarea
            value={newPost}
            onChange={(e) => setNewPost(e.target.value)}
            placeholder="What's happening in the public space?"
            className="post-textarea"
            disabled={loading || !userStats?.canPost}
          />
          {error && <div className="error-message">{error}</div>}
          <button 
            type="submit" 
            className="post-button"
            disabled={loading || !newPost.trim() || !userStats?.canPost}
          >
            {loading ? "Posting..." : "Post to Public Space"}
          </button>
        </form>
      </div>

      {/* Follow/Unfollow Section */}
      <div className="follow-section">
        <h3>👥 Connect with Others</h3>
        <div className="users-grid">
          {allUsers
            .filter(u => u.email !== user?.email)
            .map((userItem) => (
              <div key={userItem.email} className="user-card">
                <div className="user-info">
                  <img 
                    src={userItem.profileImage || "/default-avatar.png"} 
                    alt="Profile" 
                    className="user-avatar"
                  />
                  <div className="user-details">
                    <h4>{userItem.name || userItem.email.split("@")[0]}</h4>
                    <p>@{userItem.email.split("@")[0]}</p>
                  </div>
                </div>
                <button
                  onClick={() => 
                    isFollowing(userItem.email) 
                      ? handleUnfollow(userItem) 
                      : handleFollow(userItem)
                  }
                  className={`follow-button ${isFollowing(userItem.email) ? 'unfollow' : 'follow'}`}
                >
                  {isFollowing(userItem.email) ? "Unfollow" : "Follow"}
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* Posts Section */}
      <div className="posts-section">
        <h3>📰 Recent Posts</h3>
        <div className="posts-list">
          {posts.map((post) => (
            <div key={post._id} className="post-card">
              <div className="post-header">
                <img 
                  src={post.profilephoto || "/default-avatar.png"} 
                  alt="Profile" 
                  className="post-avatar"
                />
                <div className="post-user-info">
                  <h4>{post.name}</h4>
                  <p>@{post.username}</p>
                  <span className="post-time">
                    {new Date(post.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="post-content">
                <p>{post.post}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PublicSpace;
