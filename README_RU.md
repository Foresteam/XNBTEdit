# XNBTEdit. Редактируйте NBT с помощью XML
![](logo.png)

NBT-XML конвертер & редактор
## Возможности
* NBT -> XML и обратно
* Легкое редактирование на XML
* Текстовый редактор на ваш выбор
* SNBT-теги тоже парсятся. Больше не будет ужасных строк на пол-экрана!
* Массовая конвертация/редактирование

**ВНИМАНИЕ. Редактировать NBT файлы вручную - небезопасно. Убедитесь, что вы знаете, что делаете. Или, по крайней мере, создайте бекап. На всякий случай программа тоже создает таковой при каждом редактировании/конвертации, в той же папке и с расширением .backup.**

*Могут быть проблемы с не-ASCII символами.*

До преобразования:
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
После:
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
### SNBT
Изначально:
```xml
<list of="string" name="Lore">
   <string>[{"text":"Text"}]</string>
</list>
```
Но вы получите:
```xml
<list of="string" name="Lore">
   <snbt>
      <list of="compound">
         <compound>
            <string name="text">Text</string>
         </compound>
      </list>
   </snbt>
</list>
```

# Установка
## Бинарники
Скачайте дистрибутив из секции  ***Релизов***.
## Из исходников
Установите **NodeJS v16.15.1**, ***npm*** и ***yarn***.

После:
```sh
git clone https://github.com/Foresteam/XNBTEdit.git
cd XNBTEdit
yarn -D
yarn ebuild
```

Исполняемый файл будет в папке **dist_electron**.

# Usage
У этого приложения есть графический и текстовый интерфейс. Для запуска последнего:
```sh
xnbtedit -- --help
```