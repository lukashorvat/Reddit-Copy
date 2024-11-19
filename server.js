const express = require('express');
const cors = require('cors');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
let data = {
    users: [],
    posts: [],
    subreddits: ['Computer Science', 'Politics', 'History']
};
try {
    const savedData = fs.readFileSync('data.json');
    data = JSON.parse(savedData);
} catch (err) {
    console.log('Starting with empty data');
}
const saveData = () => {
    fs.writeFileSync('data.json', JSON.stringify(data));
};
app.post('/api/users/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    if (data.users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    
    const user = {
        id: Date.now(),
        username,
        password, 
        subscribedSubreddits: [],
        upvotedPosts: []
    };
    
    data.users.push(user);
    saveData();
    res.json({ id: user.id, username: user.username });
});

app.post('/api/users/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = data.users.find(u => 
        u.username === username && u.password === password
    );
    
    if (user) {
        res.json({ id: user.id, username: user.username });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/users/:id/profile', (req, res) => {
    const user = data.users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userPosts = data.posts.filter(post => post.userId === user.id);
    const totalUpvotes = userPosts.reduce((sum, post) => sum + post.upvotes, 0);
    
    res.json({
        username: user.username,
        subscribedSubreddits: user.subscribedSubreddits,
        posts: userPosts,
        totalUpvotes
    });
});
app.get('/api/subreddits', (req, res) => {
    res.json(data.subreddits);
});
app.get('/api/posts', (req, res) => {
    const sortedPosts = [...data.posts].sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
    );
    res.json(sortedPosts);
});
app.get('/api/posts/:subreddit', (req, res) => {
    const subredditPosts = data.posts
        .filter(post => post.subreddit === req.params.subreddit)
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(subredditPosts);
});
app.post('/api/posts', (req, res) => {
    const { title, content, subreddit, userId } = req.body;
    if (!title || !content || !subreddit || !userId) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const user = data.users.find(u => u.id === userId);
    if (!user) {
        return res.status(401).json({ error: 'User not found' });
    }

    const post = {
        id: Date.now(),
        title,
        content,
        subreddit,
        userId,
        username: user.username,
        upvotes: 0,
        timestamp: new Date().toISOString()
    };
    
    data.posts.unshift(post); 
    saveData();
    res.json(post);
});
app.post('/api/posts/:id/upvote', (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    const post = data.posts.find(p => p.id === parseInt(req.params.id));
    const user = data.users.find(u => u.id === userId);
    
    if (!post || !user) {
        return res.status(404).json({ error: 'Post or user not found' });
    }

    if (user.upvotedPosts.includes(post.id)) {
        return res.status(400).json({ error: 'Already upvoted' });
    }
    
    post.upvotes += 1;
    user.upvotedPosts.push(post.id);
    saveData();
    res.json(post);
});
app.get('/api/info', (req, res) => {
    const userStats = data.users.map(user => {
        const userPosts = data.posts.filter(post => post.userId === user.id);
        const upvotesReceived = userPosts.reduce((sum, post) => sum + post.upvotes, 0);
        
        return {
            username: user.username,
            posts: userPosts.length,
            upvotesReceived
        };
    });
    const totalStats = {
        totalUsers: data.users.length,
        totalPosts: data.posts.length,
        totalUpvotes: data.posts.reduce((sum, post) => sum + post.upvotes, 0),
        users: userStats
    };

    res.json(totalStats);
});
app.post('/api/users/:userId/subscribe/:subreddit', (req, res) => {
    const user = data.users.find(u => u.id === parseInt(req.params.userId));
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const subreddit = req.params.subreddit;
    if (!data.subreddits.includes(subreddit)) {
        return res.status(404).json({ error: 'Subreddit not found' });
    }

    if (!user.subscribedSubreddits.includes(subreddit)) {
        user.subscribedSubreddits.push(subreddit);
        saveData();
    }
    
    res.json(user.subscribedSubreddits);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});