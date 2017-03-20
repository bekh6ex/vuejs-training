#Vuejs chat
This is some stupid chat to try out Vuejs capabilities.

##Run
In project root run:
```bash
php -S 0.0.0.0:8080
```
You are ready to go!
Just open [http://127.0.0.1:8080/index.html](http://127.0.0.1:8080/index.html) in your browser. 
You also can open it in multiple windows to emulate multiple users chatting.

##Used libraries
  * Vuejs
  * Vuex (to manage state)
  * rehttp to send HTTP requests to the server
   
##Notes
  * Sending message always takes 2 seconds. Delay is so big intentionally to see some state changes in UI.
  * If you type message text "fail" and send it, this message will not ever be sent. Also application won't be able to send any message anymore. You will have to refresh the page to continue trying.
  * Application fetches ALL the messages from backend every 1 second (`setInterval()`) and adds to current state only those that are new.
  * Application executes only one "send" request at any given point in time. If you try to send a new message, but another message is being send, then new message will be added to the message queue and after current message is sent all queued messages will be sent in one batch.
  * Application uses optimistic approach. When you send message, it will be added in the chat with current date, but marked as "pending". When it is sent, then date of the message will be updated according to the date on the server and message status will be changed.
