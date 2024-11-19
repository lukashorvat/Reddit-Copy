let currentUser = null;
        let currentSubreddit = null;

        function checkAuth() {
            if (currentUser) {
                document.getElementById('authForms').style.display = 'none';
                document.getElementById('loggedInContent').style.display = 'block';
                document.getElementById('userNav').innerHTML = `
                    <span>Welcome, ${currentUser.username}</span>
                    <button onclick="window.location.href='profile.html'">View Profile</button>
                    <button onclick="logout()">Logout</button>
                `;
                loadProfile();
            } else {
                document.getElementById('authForms').style.display = 'none';
                document.getElementById('loggedInContent').style.display = 'none';
                document.getElementById('userNav').innerHTML = `
                    <button onclick="showAuthForms()">Login/Register</button>
                `;
            }
        }
        async function register() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('user', JSON.stringify({
                    username: data.username,
                    token: data.token
                }));
                window.location.href = '/posts.html';
            } else {
                alert('Registration failed');
            }
        }
        document.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                register();
            }
        });
        async function register() {
            const username = document.getElementById('registerUsername').value;
            const password = document.getElementById('registerPassword').value;          
            const response = await fetch('http://localhost:3000/api/users/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const user = await response.json();
                currentUser = user;
                checkAuth();
                loadSubreddits();
            } else {
                alert('Username already exists');
            }
        }

        async function login() {
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('user', JSON.stringify({
                    username: data.username,
                    token: data.token
                }));
                currentUser = {
                    username: data.username,
                    token: data.token
                };
                window.location.href = '/posts.html';
            } else {
                alert('Invalid credentials');
            }
        }

        function logout() {
            currentUser = null;
            localStorage.removeItem('user');
            checkAuth();
        }

        async function loadProfile() {
            const response = await fetch(`http://localhost:3000/api/users/${currentUser.id}/profile`);
            const profile = await response.json();
            
            document.getElementById('profile').innerHTML = `
                <h3>${profile.username}'s Profile</h3>
                <p>Total Upvotes Received: ${profile.totalUpvotes}</p>
                <p>Subscribed Subreddits: ${profile.subscribedSubreddits.join(', ') || 'None'}</p>
            `;
        }

        async function loadSubreddits() {
            const response = await fetch('http://localhost:3000/api/subreddits');
            const subreddits = await response.json();
            
            const container = document.getElementById('subreddits');
            const select = document.getElementById('postSubreddit');
            
            container.innerHTML = '';
            select.innerHTML = '';
            
            subreddits.forEach(subreddit => {
                const button = document.createElement('button');
                button.className = 'subreddit-button';
                button.textContent = subreddit;
                button.onclick = () => loadPosts(subreddit);
                container.appendChild(button);

                const option = document.createElement('option');
                option.value = subreddit;
                option.textContent = subreddit;
                select.appendChild(option);
            });
        }

        async function loadPosts(subreddit) {
            currentSubreddit = subreddit;
            const response = await fetch(`http://localhost:3000/api/posts/${subreddit}`);
            const posts = await response.json();
            
            const container = document.getElementById('posts');
            container.innerHTML = `<h2>r/${subreddit}</h2>`;
            
            posts.forEach(post => {
                container.innerHTML += `
                    <div class="post">
                        <h3>${post.title}</h3>
                        <p>${post.content}</p>
                        <div class="post-info">
                            Posted by ${post.username}
                        </div>
                        <button class="upvote-button" onclick="upvotePost(${post.id})">
                            Upvote (${post.upvotes})
                        </button>
                        ${currentUser ? `<button onclick="subscribeToSubreddit('${subreddit}')">Subscribe</button>` : ''}
                    </div>
                `;
            });
        }

        async function createPost(event) {
            event.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.token) {
                alert('Please login first');
                return;
            }

            const title = document.getElementById('postTitle').value;
            const content = document.getElementById('postContent').value;
            const subreddit = document.getElementById('postSubreddit').value;
            
            if (!title || !content) {
                alert('Please fill in both title and content');
                return;
            }
            
            const response = await fetch('http://localhost:3000/api/posts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({
                    title,
                    content,
                    subreddit
                })
            });
            
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            
            if (currentSubreddit === subreddit) {
                loadPosts(subreddit);
            }
        }

        async function upvotePost(id) {
            if (!currentUser) {
                alert('Please login to upvote');
                return;
            }
            
            await fetch(`http://localhost:3000/api/posts/${id}/upvote`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: currentUser.id })
            });
            
            if (currentSubreddit) {
                loadPosts(currentSubreddit);
            }
        }

        async function subscribeToSubreddit(subreddit) {
            if (!currentUser) return;
            
            await fetch(`http://localhost:3000/api/users/${currentUser.id}/subscribe/${subreddit}`, {
                method: 'POST'
            });
            
            loadProfile();
        }

        function showAuthForms() {
            document.getElementById('authForms').style.display = 'block';
        }
        checkAuth();
        loadSubreddits();
        window.onload = function() {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                currentUser = JSON.parse(storedUser);
                checkAuth();
                loadSubreddits();
            }
        }

        async function register() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;

            if (!username || !password) {
                alert('Please fill in all fields');
                return;
            }

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password })
                });

                if (response.ok) {
                    window.location.href = '/login.html';
                } else {
                    const data = await response.json();
                    alert(data.message || 'Registration failed');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('Registration failed. Please try again.');
            }
        }