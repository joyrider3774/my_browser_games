# Znax
Znax is a remake of a game by Nick Kouvaris.
It is a sort of puzzle / arcade game where you as the player need to select 4 blocks of the same color and 
form rectangles as big as you can where the corners of the rectangle are those 4 selected same colored blocks. 
By doing this you will erase all blocks in this rectangle and they will be replaced 
by new blocks. You keep on doing this untill the time runs out, and try to gain your highest score possible. 
There are two game modes, Relative Timer and Fixed Timer, in the first mode you'll also gain extra time for 
deleting blocks so you can play longer if you are fast enough. With the second mode you don't get extra time 
for deleting blocks but just points added to your score so here you try to get the highest amount of points in 
the given time period. 

## MicroStudio Port
This is a complete conversion of the C++ version of the game to microStudio (javascript). 
Small changes have been done compared to my other versions like:
* Fixed Timer Play Time has been reduced to 5 minutes, 10 minutes was too long
* Relative Timer Play Time has been reduced to 2.5 minutes and deleting blocks gives less extra time.
* Addition of extra clickable menu's on main menu and game screen to change skin, music and sound options
* Highlighting of options and menu's when hoovering with the mouse over it.
* Added skin that was made for the portmaster version by tekkenfade
* Frame based logic & drawing, original game used loops for remaining in a certain game state, now each gamestate handles just one frame at a time which was needed for microStudio version
* Changes to logic on certain non gameplay places, like in menu's or entering high scores and so on
* Specific changes required for microStudio like saving of highscores, sound, music and skin options, Input handling, drawing functions etc

## ChangeLog 
### Version 1.2
* Added Crossfading between the different states / screens
* Added Crossfading when highlighting or selecting menu items
* Added Crossfading when selecting a new skin
### Version 1.1
* Shows how many rectangles are possible to form in the statusbar on the right
* Made sure when a game starts there are always at least 10 rectangles to form
* Made sure when blocks are removed that there is always 1 rectangle to form
### Version 1.0
* Initial Game Release

## How To Play 
The game is playable using the mouse, keyboard, touchscreen and gamepad

### Controls Keyboard

| Key |Action|
|-----|------|
| Arrow keys | Move in menu's, Move the cursor around while playing |
| Enter, Space | Select a menu option, Select one block |
| T | Load the following skin |
| Y | Switch Music On or Off |
| U | Switch Sound On or Off |
| Escape | Quit to menu |

### Controls Gamepad

| Key |Action |
|-----|-------|
| DPAD | Move in menu's, Move the cursor around while playing |
| A | Select a menu option, Select one block |
| B | Quit to menu |
| LB | Load the following skin |
| LT | Switch Music On or Off |
| RT | Switch Sound On or Off |


### Controls Mouse & Touchscreen
Click or Touch on menu items or on the playfield to select blocks, 
when using the mouse, menu's and blocks get highlighted when hoovering over them


### Entering a highscore name 
This can only be done using keyboard or gamepad

| Key | Action |
|-----|--------|
| Up & Down | Cycle through the letters and numbers |
| Right | Move to the following letter |
| Left | Move to the previous lettter |

To erase a letter you have to choose the whitespace. 

## Skins
Znax supports 5 skins, they are replacement graphics. At any point in the game you can press `T` on the keyboard or `LB` on a gamepad to switch skins. Last skin used will be remembererd and used upon next play. 

## Credits
[Original (flash) Game](https://web.archive.org/web/20090220141735/http://lightforce.freestuff.gr/znax.php) Created by Nick Kouvaris 

[Gp2x Remake Game](https://www.willemssoft.be/index.php?main=5&sub=6&action=productdetails&id=224), 
[SDL2 version](https://github.com/joyrider3774/Znax) and this Microstudio version Created by me, Willems Davy

Game graphics Originally created in paint shop pro 7 and later modified with gimp.
All Skins made by me except for skin nr 4 (the purple one) which was made by [Tekkenfede](https://github.com/Tekkenfede) for
the [Portmaster port](https://portmaster.games/detail.html?name=znax) of the game

Music was made by Donskeeto! Specifically for the gp2x version and is reused here

Game Sounds are some parts recorded by myselve and modified with goldwave studio (for the voices),
some parts are made using [SFXR](http://www.drpetter.se/project_sfxr.html) 