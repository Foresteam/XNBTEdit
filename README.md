# XNBTEdit. Edit NBT in XML
Find JSON too hard to read and GUI too slow for your needs? Here it is.
A combination of the ease of use of high-level formats and the speed of editing in text.
## Features
* Possibility to only convert a file (NBT->XML and back)
* Easy editing in a high-level eXtensive Markup Languge
* *The text editor of your choice*
* *SNBTs are also parsed. No more scary inline tags!*

Before:
```h
0a00 0001 000b 7365 656e 4372 6564 6974
7300 0200 0944 6561 7468 5469 6d65 0000
0300 0d66 6f6f 6454 6963 6b54 696d 6572
0000 0000 0a00 0a72 6563 6970 6542 6f6f
6b09 0007 7265 6369 7065 7308 0000 0003
0014 6165 3277 746c 6962 3a6d 6167 6e65
745f 6361 7264 0035 6165 3277 746c 6962
3a77 6972 656c 6573 735f 756e 6976 6572
...
```
After:
```xml
<?xml version="1.0"?>
<compound>
	<byte name="seenCredits">false</byte>
	<short name="DeathTime">0</short>
	<int name="foodTickTimer">0</int>
	<compound name="recipeBook">
		<list of="string" name="recipes">
			<string>ae2wtlib:magnet_card</string>
			<string>ae2wtlib:wireless_universal_terminal/upgrade_crafting</string>
			<string>ae2wtlib:infinity_booster_card</string>
		</list>
		<byte name="isGuiOpen">false</byte>
		<list of="string" name="toBeDisplayed">
			<string>ae2wtlib:magnet_card</string>
			<string>ae2wtlib:wireless_universal_terminal/upgrade_crafting</string>
			<string>ae2wtlib:infinity_booster_card</string>
		</list>
		<byte name="isSmokerGuiOpen">false</byte>
		<byte name="isFurnaceFilteringCraftable">false</byte>
		<byte name="isFurnaceGuiOpen">false</byte>
		<byte name="isBlastingFurnaceFilteringCraftable">false</byte>
		<byte name="isBlastingFurnaceGuiOpen">false</byte>
		<byte name="isFilteringCraftable">false</byte>
		<byte name="isSmokerFilteringCraftable">false</byte>
	</compound>
	<int name="XpTotal">0</int>
	<byte name="OnGround">true</byte>
	<float name="AbsorptionAmount">0</float>
	<int name="playerGameType">1</int>
	<compound name="TenshiLib:Patreon">
		<int name="Color">0</int>
		<byte name="ShouldRender">true</byte>
		<int name="Location">2</int>
	</compound>
	<list of="compound" name="Attributes">
		<compound>
			<string name="Name">minecraft:generic.movement_speed</string>
			<double name="Base">0.10000000149011612</double>
		</compound>
	</list>
	...
</compound>
```
### SNBT (not implemented yet)
Basically:
```xml
<list of="string" name="Lore">
	<string>[{"text":"Text"}]</string>
</list>
```
But you'll get:
```xml
<list of="string" name="Lore">
	<string nbt="">
		<list of="compound">
			<compound>
				<string name="text">Text</string>
			</compound>
		</list>
	</string>
</list>
```

## Getting started
### Setup
Download a binary distribution from ***Releases*** section

OR **Install** NodeJS v16.13.2 (i'm using this), pnpm.
Then:
```sh
git clone https://github.com/Foresteam/XNBTEdit.git
cd XNBTEdit
pnpm install
```
To run the program:
```sh
pnpm start
```
### Usage
```sh
xnbtedit --help
```

#
Plans for now:
* SNBT support
* Add realtime editing via temp files

Maybe somewhen:
* Make it a plugin for Code / Sublime Text / Vim etc.