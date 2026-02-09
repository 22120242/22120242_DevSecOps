from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello():
    return "Hello, DevSecOps!"

@app.route('/login')
def login():
    # LỖI BẢO MẬT: Hardcoded password (Bandit sẽ phát hiện cái này)
    password = "admin_password_123" 
    return f"Login page with insecure logic."

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)