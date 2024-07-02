# Joyrider377's Browser Stuff
This is a modified Microbox "app" to show my html related games and so from any page on the internet inside Microbox and not just microStudio games. 

I modified the microBox app to be able to add it as a frontend to a repository of browser games i made on my github (see [here](https://joyrider3774.github.io/my_browser_games/)). 

## Changes i did:

* added system to load any url (game) in the iframe
* added extra fields like itemtype (game, demo, ...) and engine (wasm4, playdate, arduboy, microstudio, ...) 
* added sorting options for the new fields
* tried to fix an issue where the system could get stuck if you quickly quit or (re)launch a game (did not test if original microbox had same issue)
* placed the exit button inside a 100% width div with text-align right and removed the positioning "fixed", as well as increased the z-index for it. The reason i did this is because of certain game "engines" like WASM4. It setted some fullscreen mode as well as a higher zindex, and the button was shown behind the player (wasm4 screen) on my phone, making you unable to exit certain things you launched. I tested this change on my android phone in chrome, brave, opera, firefox and vivaldi as well as on chrome, firefox and edge on my desktop and they all remained showing the exit button. I don't know if this change would work on all phones / browsers, i don't have an iphone to test on for example. 
* searched for the frame using document.getElementByID in the setTimeout functions as i was getting errors in the javascript console when using the iFrame variable starting from the 2nd time i launched something. (did not test to see if original microbox had same issue)
* added an onmessage handler that goes togheter with a little script to notify microbox the game has started and so/

## Loading from different urls

The loading from a different url can be made to work with any html based game if you add the html script code seen below. It works by using postmessage calls and an onmessage handler between the iframe and parent window to detect a game being started or quit using ESC key or Menu button on gamepad without it the screen remained black when using non microStudio urls
The script also makes use of a [javascript class](https://github.com/alvaromontoro/gamecontroller.js/blob/master/dist/gamecontroller.min.js) to handle game input so all my game (pages) can quit also when the menu button on the gamepad is pressed.

this is the script that you need to add to your games html pages:

```
<script>
    if(window.parent)
    {
      window.document.addEventListener('keydown', (event) => {
        if(event.key == "Escape")
        {
          console.log('sended quit');
          window.parent.postMessage(JSON.stringify({name:"quit"}), "*");
        }
      });
      
      window.addEventListener('load', (event) => {
        console.log('sended start');
        window.parent.postMessage(JSON.stringify({name: "start"}), "*");
      });
    }
</script>
<script src="./gamecontroller.min.js" >
      gameControl.on('connect', function(gamepad) {
        gamepad.before('start', function() {
          console.log('sended gamepad quit');
          window.parent.postMessage(JSON.stringify({name:"quit"}), "*");
        });
      });
</script>

```

## Credits
This wouldn't have been possible without the [original microbox code](https://microstudio.dev/i/gilles/microbox/) from Gilles and now i have a neat frontend for my html web stuff :)
I also thank [alvarmontoro](https://github.com/alvaromontoro) for his gamecontroller javascript. I also made use of multiple sites to look up properties and javascript functions and 
found helpfull things on stackoverflow, mozilla developper site and w3schools