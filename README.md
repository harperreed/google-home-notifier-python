# A notification server that sends notifications to Google Home

This is pretty simple. I had started using [noelportugal's node Google Home Notifier](https://github.com/noelportugal/google-home-notifier) but was having some issues with stability. 

I decided to write it in a language i know a bit better - python! yay. Python is your friend. 

The gist is this: 

This is a webservice that has two endpoints:

- /play/ - plays an mp3 on the google home that is in the static folder
- /say/ - uses googles unofficial google translate TTS service to say a notification

# How

## getting started

This uses flask and you should just be able to install the requirements: `pip install -r requirements.txt` and then run the webservice `python main.py`

## running for real

I use docker to run it. It works pretty well. I even included some pretty good docker script that will make it easier. Please check that out for more help. 

# TODO

* Break out the google home bits and make it easy to integrate into other projects and not just a webservice
* It may have some hardcoded parts for my specific install of google homes (specifically a play group)


# HMU

harper@nata2.org

@harper on twitter
