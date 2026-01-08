from flask import Flask, request

app = Flask(__name__)

@app.route('/')
def home():
    return "<h1>Vulnerable App Running!</h1>"

@app.route('/echo')
def echo():
    user_input = request.args.get('msg')
    return f"Hello {user_input}"

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)