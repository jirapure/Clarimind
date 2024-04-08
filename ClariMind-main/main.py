# coding: utf-8
"""
    flask_oauthlib.client
    ~~~~~~~~~~~~~~~~~~~~~

    Implements OAuth1 and OAuth2 support for Flask.

    :copyright: (c) 2013 - 2014 by Hsiaoming Yang.
"""

import logging
from functools import wraps
from flask import Flask, render_template, request, redirect, session, url_for
from flask_oauthlib.client import OAuth
from openai import OpenAI
import os
import requests
#from werkzeug.urls import url_quote, url_decode, url_encode
from itertools import zip_longest
from werkzeug import urls as my_urls
app = Flask(__name__)
app.secret_key = 'f3d0782d-5ca1-4636-a34f-1efc45999806'  # Change this to a random secret key

# Set your OpenAI API key
os.environ["OPENAI_API_KEY"] = "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"
client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])



oauth = OAuth(app)

# Google configuration
google = oauth.remote_app(
    'google',
    consumer_key='245915103530-gbjga3d2aaupvtcti8kgadkdmed8v4uj.apps.googleusercontent.com',
    consumer_secret='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',
    request_token_params={
        'scope': 'email',
    },
    base_url='https://www.googleapis.com/oauth2/v1/',
    request_token_url=None,
    access_token_method='POST',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    authorize_url='https://accounts.google.com/o/oauth2/auth',
)

@google.tokengetter
def get_google_oauth_token():
    return session.get('google_token')

def contains_binomial(prompt):
    # Check if the prompt contains keywords indicative of a binomial question
    binomial_keywords = ["should", "shall", "whether", "decision", "choose", "select", "can", "could"]
    return any(keyword in prompt.lower() for keyword in binomial_keywords)

def has_profanity(text):
    # Check if the text contains profanity
    abusive = ["sexy", "sex", "porn", "xxx", "fuck", "nude","die","death","murder","suicide"]
    return any(keyword in text.lower() for keyword in abusive)

def generate_decision(scenario):
    options = scenario.split(" or ")
    all_results = []

    for option in options:
        retries = 2
        while retries > 0:
            messages = [
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": f"I am trying to decide whether to {option}. What do you think?"},
                {"role": "assistant", "content": "I can provide you with information and suggestions to help you make an informed decision. What factors are you considering, and do you have any specific preferences or concerns?"},
                {"role": "user", "content": f"Provide me 3 very short pros and 3 very short cons of {option}."}
            ]
            
            try:
                response = client.chat.completions.create(
                    model='gpt-3.5-turbo',
                    messages=messages,
                    max_tokens=500,  # Adjust the max_tokens based on the expected response length
                    stop=None,
                    temperature=0.7
                )

                # Access generated text from response.choices[0].content
                content = response.choices[0].message.content.strip()

                # Check if "Pros:" and "Cons:" are present in the response
                if "Pros:" in content and "Cons:" in content:
                    # Split the response into decision, pros, and cons
                    decision, pros_cons_text = content.split("Pros:")
                    decision = decision.strip()
                    pros_cons_text = pros_cons_text.strip()

                    # Split pros and cons
                    pros, cons = [item.strip() for item in pros_cons_text.split("Cons:")]
                    
                    all_results.append((decision, pros, cons))
                    break  # Break out of the retry loop if a complete response is received
                else:
                    retries -= 1  # Decrement retries if the response is incomplete
            except Exception as e:
                print(f"An error occurred: {e}")
                retries -= 1  # Decrement retries if an error occurs

        if retries == 0:
            all_results.append(("Unable to generate a complete response.", "", ""))

    return all_results

def custom_zip_longest(a, b, fillvalue=''):
    return zip_longest(a, b, fillvalue=fillvalue)

app.jinja_env.filters['zip_longest'] = custom_zip_longest

@app.route('/decision', methods=['GET', 'POST'])
def decision():
    if 'user_email' not in session:  # Check if session is not set
        return redirect(url_for('index'))
    if request.method == 'POST':
        user_prompt = request.form['user_prompt']
        scenario = request.form['user_prompt']
        user_email = request.form['user_email']
        results = generate_decision(scenario)
        api_url = "https://testbeds.space/apps/decision-making/public/api/decision_prompt"
        data = {'prompt': user_prompt,'user_email':user_email}
        response = requests.post(api_url, json=data)

        return render_template('decision.html', user_prompt=user_prompt, results=results)
    return render_template('decision.html', user_prompt='',results='')

def process_feedback(user_prompt, feedback_type,feedback_text):
    # Process the feedback
    print(f"Received [{feedback_type }] feedback for user prompt:- {user_prompt},  with feedback [{feedback_text}]")

@app.route('/feedback', methods=['POST'])
def handle_feedback():
    if request.method == 'POST':
        user_prompt = request.form['prompt']
        feedback_type = request.form['feedback_type']
        feedback_text = request.form['feedback_text']
        harmful = request.form['harmful']
        abusive = request.form['abusive']
        user_email = session['user_email']

        api_url = "https://testbeds.space/apps/decision-making/public/api/feedback"
        data = {'user_prompt':user_prompt,'feedback_type':feedback_type,'feedback_text':feedback_text,'user_email':user_email, 'abusive': abusive, 'harmful': harmful}
        response = requests.post(api_url, data)

        process_feedback(user_prompt, feedback_type, feedback_text)
        return f"Received feedback ({feedback_type}) for user prompt: ({user_prompt}) with feedback: ({feedback_text}) is: ({abusive}) and: ({harmful})"

@app.route('/register', methods=['POST'])
def register():
    if request.method == 'POST':
       
        email = request.form['email']
        password = request.form['password']      

        api_url = "https://testbeds.space/apps/decision-making/public/api/register"
        data = {'email':email,'password':password}
        response = requests.post(api_url, data)
        # return response

        
        if response.status_code == 200:
            if "success" in response.text:
                session['user_email'] = email
                return render_template('verification.html')
            else:
                return "Registration failed"
        else:
            return "Registration failed"
@app.route('/user_login', methods=['POST'])
def user_login():
    if request.method == 'POST':
        email = request.form['user_email']
        password = request.form['password']

        api_url = "https://testbeds.space/apps/decision-making/public/api/user_login"
        data = {'email': email, 'password': password}
        
        response = requests.post(api_url, data=data)
        
        if response.status_code == 200:
            if "success" in response.text:
                session['user_email'] = email
                return redirect(url_for('decision'))

                # js_code = f"window.open('/', '_blank')"
        
                # # Return the JavaScript code as a response
                # return f"<script>{js_code}</script>"
                js_code = f"window.location.href = '/index'"

                # Return the JavaScript code as a response
                # return js_code


            else:
                return "Login failed"
        else:
            return "Login failed"

@app.route('/verify', methods=['GET'])
def verify():
    auth_token = request.args.get('auth')
    if auth_token:
        api_url = "https://testbeds.space/apps/decision-making/public/api/verify_account"
        data = {'email': auth_token}
        
        response = requests.post(api_url, data=data)
        if response.ok:
            # Assuming 'email' is returned from the response
            session['user_email'] = response.json().get('email')
            return redirect(url_for('decision'))
        else:
            return "Verification failed"  # Handle failed verification
    else:
        return "Invalid request"  # Handle invalid request

        

        
        

@app.route('/', methods=['GET'])
def index():
    return render_template('home.html')
@app.route('/reset_password', methods=['GET'])
def reset_password():
    return render_template('reset.html')

@app.route('/new_password', methods=['GET'])
def new_password():
    auth_token = request.args.get('auth')
    if auth_token:
        # Do something with the auth token
        return render_template('new_password.html', auth_token=auth_token,) 
        # return f'Auth token received: {auth_token}'
    else:
        return 'No auth token provided'
@app.route('/password_reset', methods=['get','post'])
def password_reset():
    email = request.form['email']
    api_url = "https://testbeds.space/apps/decision-making/public/api/forgot_pass"
    data = {'email': email}
    response = requests.post(api_url, data)
    return render_template('reset_message.html')

@app.route('/save_password', methods=['post'])
def save_password():
    email = request.form['email']
    newPassword = request.form['newPassword']
    api_url = "https://testbeds.space/apps/decision-making/public/api/save_password"
    data = {'email': email,'newPassword':newPassword}
    response = requests.post(api_url, data)
    return redirect(url_for('index'))



@app.route('/regenerate', methods=['POST'])
def regenerate():
    user_prompt = request.form['user_prompt']
    api_url = "https://testbeds.space/apps/decision-making/public/api/decision_prompt"
    data = {'prompt': user_prompt}
    response = requests.post(api_url, json=data)
    decision, pros, cons, conclusion = generate_decision(user_prompt)

    return render_template('decision.html', user_prompt=user_prompt, decision=decision, pros=pros, cons=cons, conclusion=conclusion)

@app.route('/manual_login')
def manual_login():
    
    return render_template('login.html')
@app.route('/signup')
def signup():
    
    return render_template('signup.html')

@app.route('/login_process', methods=['get','post'])
def login_process():
    email = request.form['email']
    return render_template('login_process.html', email=email)

@app.route('/signup_process', methods=['get','post'])
def signup_process():
    email = request.form['email']
    return render_template('signup_process.html', email=email)


@app.route('/login')
def login():
    print(session)  # Print the session to check if the 'google_token' is present
    if 'google_token' in session:
        # If user is already logged in, print a message and redirect to index
        api_url = "https://testbeds.space/apps/decision-making/public/api/register"
        data = {'email': session['user_email']}
        response = requests.post(api_url, data)
        print("User is already logged in")
        return redirect(url_for('decision'))

    print("User is not logged in, proceeding with authorization")
    return google.authorize(callback=url_for('authorized', _external=True))

@app.route('/logout')
def logout():
    session.clear()  # Destroy the session
    return 'Logged out successfully! <a href="/">Home</a>'

    
@app.route('/login/authorized')
def authorized():
    response = google.authorized_response()
    app.logger.info("Response from Google: %s", response)
    
    if response is None or response.get('access_token') is None:
        return 'Access denied: reason={} error={}'.format(
            request.args['error_reason'],
            request.args['error_description']
        )
    
    access_token = response['access_token']
    session['google_token'] = (access_token, '')

    # Fetch user's email address from Google API
    profile_resp = google.get('userinfo')
    app.logger.info("Profile response from Google: %s", profile_resp)
    
    profile_data = profile_resp.data  # Access data from OAuthResponse
    user_email = profile_data.get('email')
    app.logger.info("User email: %s", user_email)

    # Store or use the email address as needed
    session['user_email'] = user_email
    api_url = "https://testbeds.space/apps/decision-making/public/api/register"
    data = {'email': session['user_email']}
    response = requests.post(api_url, data)


    
    return redirect(url_for('decision'))


if __name__ == '__main__':
        app.run(debug=True, port=5000)
