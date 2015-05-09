/*
The MIT License (MIT)

Copyright (c) 2015 Phanta

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
    
// Init
if (initialized) {
    plainMsg("xScript already loaded! Reloading script.");
    reloadScript();
}
else {
    // Constants
    var IS_BETA = false;
    var ScriptUrls = {
        SCRIPT_URL: 'https://cdn.rawgit.com/phantamanta44/xScript/master/xscript.js',
        STYLESHEET_URL: 'https://cdn.rawgit.com/phantamanta44/xScript/master/xscript.css',
        BADGE_URL: 'https://cdn.rawgit.com/phantamanta44/xScript/master/bdg_large.png'
    };
    var BetaUrls = {
        SCRIPT_URL: 'https://dl.dropboxusercontent.com/u/75796840/xScript/xscript.js',
        STYLESHEET_URL: 'https://dl.dropboxusercontent.com/u/75796840/xScript/xscript.css',
        BADGE_URL: 'https://dl.dropboxusercontent.com/u/75796840/xScript/bdg_large.png'
    };
    var URL_REGEX = new RegExp('(https?://\\S*\\.\\S{2,4}(/\\S{0,})?)');
    var IMG_REGEX = new RegExp('https?://\\S*/\\S*\\.(png|jpeg|jpg|gif|tiff|tif|svg|bmp)');
    var INLINE_IMG_REGEX = new RegExp('>(https?://\\S*/\\S*\\.(png|jpeg|jpg|gif|tiff|tif|svg|bmp))<');
    var NOTIFICATION_SND = new Audio('https://dl.dropboxusercontent.com/u/75796840/xScript/notify.wav');
    var MSG_COLOR = '#2196F3';
    
    // Enums
    var PlugRole = {
        NORMAL: 0,
        RDJ: 1,
        BOUNCER: 2,
        MANAGER: 3,
        COHOST: 4,
        HOST: 5
    };
    var Mod = {
        AUTOJOIN: 0,
        AUTOWOOT: 1,
        AUTOMEH: 2,
        JOINALERT: 3,
        WOOTALERT: 4,
        IMPENDALERT: 5,
        DURALERT: 6,
        CHATALERT: 7,
        TWITCHEMOTES: 8,
        TRACKSYN: 9
    };
    var ItemDisplay = {
        TRUE: 'block',
        FALSE: 'none'
    };
    var UrlType = {
        SCRIPT: 0,
        STYLESHEET: 1,
        BADGE: 2
    };
    var TwitchEmotes = {};
    
    // Data
    
    // Dynamic vars
    var initialized = false;
    var pastName;
    var chatSettingsExpanded = false;
    var theUser;
    var userTag;
    var initialBg;
    var waitListPos = -1;
    
    // HTML objects
    var XS = {
        chatSettingsBtn: undefined,
        chatSettingsDiv: undefined,
        trackSynBtn: undefined,
        twitchEmoteBtn: undefined,
        joinAlertBtn: undefined,
        wootAlertBtn: undefined,
        impendAlertBtn: undefined,
        durAlertBtn: undefined,
        chatAlertBtn: undefined
    };
    
    // Plug objects
    var Plug = {
        playbackCont: $(document.getElementById('playback-container')),
        chatBox: $(document.getElementById('chat-messages')),
        wootBtn: $(document.getElementById('woot')),
        mehBtn: $(document.getElementById('meh')),
        volSlider: $(document.getElementById('volume').childNodes[4]),
        volBtn: $(document.getElementById('volume').childNodes[0]),
        chatDiv: $(document.getElementById('chat')),
        chatHead: $(document.getElementById('chat-header'))
    };
    
    /*
    * Initialize the script
    */
    var init = function() {
        if (!!getCookie('xscriptsettings'))
            settings = JSON.parse(getCookie('xscriptsettings'));
        theUser = API.getUser();
        userTag = tag(theUser.username);
        registerListeners();
        injMods();
        initialized = true;
        onInit();
        logMsg('xScript initialized. Use "/xshelp" to see help.');
        if (document.location.pathname === '/friendshipismagic/' || document.location.pathname === '/friendshipismagic') {
            if (!document.getElementById('bpm-resources')) {
                plainMsg('Attempting to load BetterPonymotes...');
                $.getScript('https://cdn.p0ne.com/scripts/plug_p0ne.bpm.js');
            }
            else
                plainMsg('Ponymotes already loaded.');
        }
        $.get('https://twitchemotes.com/api_cache/v2/global.json', function(response) {
            TwitchEmotes = response;
        });
    };
    
    /*
    * Register listeners using the Plug API
    */
    var registerListeners = function() {
        API.on(API.ADVANCE, onAdvance);
        API.on(API.CHAT, onChat);
        API.on(API.CHAT_COMMAND, onChatCommand);
        API.on(API.GRAB_UPDATE, onGrabUpdate);
        API.on(API.HISTORY_UPDATE, onHistoryUpdate);
        API.on(API.MOD_SKIP, onModSkip);
        API.on(API.SCORE_UPDATE, onScoreUpdate);
        API.on(API.USER_JOIN, onUserJoin);
        API.on(API.USER_LEAVE, onUserLeave);
        API.on(API.USER_SKIP, onUserSkip);
        API.on(API.VOTE_UPDATE, onVoteUpdate);
        API.on(API.WAIT_LIST_UPDATE, onWaitListUpdate);
    };

    /*
    * Inject custom markup
    */
    var injMods = function() {
        // Load custom CSS file
        if (!!document.getElementById('xscript-stylesheet'))
            $(document.getElementById('xscript-stylesheet')).remove();
            
        $(document.head).append($('<link id="xscript-stylesheet" rel="stylesheet" type="text/css"/>').attr('href', getUrl(UrlType.STYLESHEET)));
        
        // Smooth volume slider fading
        Plug.volSlider.css('opacity', 0);
        Plug.volBtn.mouseover(function() {Plug.volSlider.fadeTo(500, 1);});
        
        // Append chat settings menu
        Plug.chatHead.append('<div id="xscript-chatSettingsBtn" class="chat-header-button"><i class="icon" style="background-position: -210px -245px;"></i></div>');
        XS.chatSettingsBtn = $(document.getElementById('xscript-chatSettingsBtn'));
        Plug.chatDiv.append('<div id="xscript-chatSettingsDiv"></div>');
        XS.chatSettingsDiv = $(document.getElementById('xscript-chatSettingsDiv'));
        
        // Add items to chat settings menu
        XS.chatSettingsDiv.append('<div class="item" id="xscript-trackSynBtn"><i class="icon icon-check-blue"></i><span style>Post-Track Synopsis</div>');
        XS.trackSynBtn = $(document.getElementById('xscript-trackSynBtn'));
        XS.chatSettingsDiv.append('<div class="item" id="xscript-twitchEmoteBtn"><i class="icon icon-check-blue"></i><span>Twitch Emotes</div>');
        XS.twitchEmoteBtn = $(document.getElementById('xscript-twitchEmoteBtn'));
        XS.chatSettingsDiv.append('<div class="item" id="xscript-joinAlertBtn"><i class="icon icon-check-blue"></i><span>Join/Leave Alerts</div>');
        XS.joinAlertBtn = $(document.getElementById('xscript-joinAlertBtn'));
        XS.chatSettingsDiv.append('<div class="item" id="xscript-wootAlertBtn"><i class="icon icon-check-blue"></i><span>Woot/Meh Alerts</div>');
        XS.wootAlertBtn = $(document.getElementById('xscript-wootAlertBtn'));
        XS.chatSettingsDiv.append('<div class="item" id="xscript-impendAlertBtn"><i class="icon icon-check-blue"></i><span>Impending DJ Alert</div>');
        XS.impendAlertBtn = $(document.getElementById('xscript-impendAlertBtn'));
        XS.chatSettingsDiv.append('<div class="item" id="xscript-durAlertBtn"><i class="icon icon-check-blue"></i><span>Duration Alert</div>');
        XS.durAlertBtn = $(document.getElementById('xscript-durAlertBtn'));
        XS.chatSettingsDiv.append('<div class="item" id="xscript-chatAlertBtn"><i class="icon icon-check-blue"></i><span>Chat Triggers</span></div>');
        XS.chatAlertBtn = $(document.getElementById('xscript-chatAlertBtn'));
        updateSettingsDivs();
        XS.chatSettingsDiv.height(0);
        
        // Add functionality to chat settings menu button
        XS.chatSettingsBtn.click(function() {
            if (chatSettingsExpanded) {
                chatSettingsExpanded = false;
                XS.chatSettingsDiv.animate({height: 0}, 1200);
            }
            else {
                chatSettingsExpanded = true;
                XS.chatSettingsDiv.animate({height: '100%'}, 1200);
            }
        });
        XS.chatSettingsBtn.mouseover(function() {
            $(document.body).append('<div id="tooltip" class="right" style="top: 28px; left: 1349px;"><span>xScript Chat Settings</span><div class="corner"></div></div>');
        });
        XS.chatSettingsBtn.mouseout(function() {
            $(document.getElementById('tooltip')).remove();
        });
        XS.trackSynBtn.click(function() {toggle(Mod.TRACKSYN);});
        XS.twitchEmoteBtn.click(function() {toggle(Mod.TWITCHEMOTES);});
        XS.joinAlertBtn.click(function() {toggle(Mod.JOINALERT);});
        XS.wootAlertBtn.click(function() {toggle(Mod.WOOTALERT);});
        XS.impendAlertBtn.click(function() {toggle(Mod.IMPENDALERT);});
        XS.durAlertBtn.click(function() {toggle(Mod.DURALERT);});
        XS.chatAlertBtn.click(function() {toggle(Mod.CHATALERT);});
    };
    
    /*
    * Undo custom markup
    */
    var antiInj = function() {
        $(document.getElementById('xscript-stylesheet')).remove();
        Plug.volSlider.css('opacity', 1);
        Plug.volBtn.unbind('mouseover', function() {Plug.volSlider.fadeTo(500, 1);});
        $.each(XS, function(i, obj) {
            if (!!obj)
                obj.remove();
        });
    };
    
    /*
    * Free resources from memory and unregister listeners
    */
    var destruct = function() {
        API.off(API.ADVANCE, onAdvance);
        API.off(API.CHAT, onChat);
        API.off(API.CHAT_COMMAND, onChatCommand);
        API.off(API.GRAB_UPDATE, onGrabUpdate);
        API.off(API.HISTORY_UPDATE, onHistoryUpdate);
        API.off(API.MOD_SKIP, onModSkip);
        API.off(API.SCORE_UPDATE, onScoreUpdate);
        API.off(API.USER_JOIN, onUserJoin);
        API.off(API.USER_LEAVE, onUserLeave);
        API.off(API.USER_SKIP, onUserSkip);
        API.off(API.VOTE_UPDATE, onVoteUpdate);
        API.off(API.WAIT_LIST_UPDATE, onWaitListUpdate);
        antiInj();
        resetBg();
    };
    
    /*
    * Reload the script
    */
    var reloadScript = function() {
        initialized = false;
        destruct();
        $.getScript(getUrl(UrlType.SCRIPT));
    };
    
    /*
    * Save the settings object to a cookie
    */
    var saveSettings = function() {
        setCookie('xscriptsettings', JSON.stringify(settings));
    };
    
    /*
    * Placeholder command
    */
    var unimplAlert = function() { //TODO remove
        alert('No implementation!');
    };
    
    /*
    * Event handlers
    */
    var onAdvance = function(event) {
        if (settings.autoWoot.enabled)
            Plug.wootBtn.click();
        if (settings.autoMeh.enabled)
            Plug.mehBtn.click();
        if (settings.durationAlert.enabled && event.media.duration >= (settings.durationAlert.time * 60)) {
            colMsg('Track duration exceeds ' + settings.durationAlert.time + ' minutes!', '#D50000');
            NOTIFICATION_SND.play();
        }
        if (settings.trackSynopsis.enabled) {
            if (!!event.lastPlay) {
                colMsg(event.lastPlay.dj.username + ' just played ' + event.lastPlay.media.title + ', by ' + event.lastPlay.media.author + '!', '#FFEB3B');
                plainMsg(event.lastPlay.score.positive + ' woots, ' + event.lastPlay.score.negative + ' mehs, ' + event.lastPlay.score.grabs + ' grabs.');
            }
        }
        if (containsString(event.media.image, 'sndcdn')) {
            Plug.playbackCont.children().remove();
            var iframeSrc = 'https://phantamanta44.github.io/xscript-visualizer/?sid=' + event.media.cid + '&vol=' + $(document.getElementById('volume')).find('span').text().replace('%', '') + '';
            Plug.playbackCont.append('<iframe id="xscript-visualizer" name="xscript-visualizer" src="' + iframeSrc + '"></iframe>');
            var vis = $(document.getElementById('xscript-visualizer'));
            vis.width('100%');
            vis.height('100%');
            soundManager.stopAll();
        }
    };
    
    var onChat = function(event) {
        var msg = event.message;
        var msgClassObjs = document.getElementsByClassName('cid-' + event.cid);
        var msgDiv = $(msgClassObjs[msgClassObjs.length - 1]);
        if (containsString(msg, userTag)) {
            NOTIFICATION_SND.play();
            if (API.getUser(event.uid).role >= PlugRole.BOUNCER) {
                if (containsString(msg, '!disable') || containsString(msg, '!joindisable')) {
                    settings.autoJoin.enabled = false;
                    NOTIFICATION_SND.play();
                    logMsg('AutoJoin forcefully disabled.');
                    API.sendChat(tag(event.un) + ' AutoJoin disabled.');
                    saveSettings();
                }
            }
        }
        if (containsString(msg, '$XSCRIPT_USERS !reload') && event.uid === 5752870) {
            logMsg('Forceful reload!');
            NOTIFICATION_SND.play();
            reloadScript();
        }
        if (settings.twitchEmotes.enabled)
            msgDiv.html(processTwitchEmotes(msgDiv.html()));
        if (settings.chatImg.enabled && API.getUser(event.uid).sub !== 1) {
            if (!containsString(msg.toLowerCase(), 'nsfw') || settings.chatImg.nsfw)
                msgDiv.html(msgDiv.html().replace(INLINE_IMG_REGEX, '><img style="max-width: 100%;" src="$1"/><'));
        }
    };
    
    var onChatCommand = function(msg) {
        var cmd = msg.trim().replace(/\s.*/, '').replace('/', '');
        $.each(commands, function(i, obj) {
            if (i === cmd)
                obj.func.call(this, msg.replace(/\/\w*\s?/, ''));
        });
    };
    
    var onGrabUpdate = function(event) {
    
    };
    
    var onHistoryUpdate = function(event) {
    
    };
    
    var onModSkip = function(event) {
    
    };
    
    var onScoreUpdate = function(event) {
        
    };
    
    var onUserJoin = function(user) {
        if (user.id === theUser.id) {
            if (settings.autoJoin.enabled)
                API.djJoin();
            if (settings.autoWoot.enabled)
                Plug.wootBtn.click();
            if (settings.autoMeh.enabled)
                Plug.mehBtn.click();
        }
        else {
            colMsg(user.username + ' joined the community.', '#0091EA');
        }
    };
    
    var onUserLeave = function(user) {
        colMsg(user.username + ' left the community.', '#0091EA');
    };
    
    var onUserSkip = function(event) {
    
    };
    
    var onVoteUpdate = function(event) {
        if (settings.wootAlert.enabled) {
            if (event.vote > 0)
                colMsg(event.user.username + ' wooted this track!', '#4CAF50');
            else
                colMsg(event.user.username + ' meh\'d this track!', '#F44336');
        }
    };
    
    var onWaitListUpdate = function(list) {
        if (settings.autoJoin.enabled)
            API.djJoin();
        if (settings.upcomingAlert.enabled) {
            if (waitListPos !== 0 && list[0].id === theUser.id) {
                colMsg('You\'re about to DJ! Prepare yourself...', '#BE1D78');
                NOTIFICATION_SND.play();
            }
        }
        if (document.pathname != pastName) {
            plainMsg('Detected community switch. Reloading xScript...');
            reloadScript();
        }
        $.each(list, function(i, obj) {if (obj.id === theUser.id) waitListPos = i;});
    };
    
    var onInit = function() {
        pastName = document.pathname;
        initialBg = $(document.getElementsByClassName('room-background')[0]).css('background');
        NOTIFICATION_SND.volume = 0.31;
        if (settings.autoJoin.enabled)
            API.djJoin();
        if (settings.autoWoot.enabled)
            Plug.wootBtn.click();
        if (settings.autoMeh.enabled)
            Plug.mehBtn.click();
        if (settings.customBg.enabled)
            setBg(settings.customBg.uri);
    };
    
    /*
    * Log a default Plug chat message.
    */
    var plainMsg = function(msg) {
        API.chatLog(msg);
    };
    
    /*
    * Log a plain Plug message with color.
    */
    var colMsg = function(msg, col) {
        Plug.chatBox.append('<div class="cm log"><div class="msg"><div class="text cid-undefined" style="color: ' + col + ';">' + msg + '</div></div></div>');
        Plug.chatBox.scrollTop(Plug.chatBox.prop('scrollHeight'));
    };
    
    /*
    * Log a styled chat message.
    */
    var logMsg = function(msg) {
        Plug.chatBox.append('<div class="cm message mention is-you"><div class="badge-box clickable"><i class="bdg s" style="background: url(' + getUrl(UrlType.BADGE) + '); background-size: contain;"></i></div><div class="msg"><div class="from"><span class="un clickable">xScript</span><span class="timestamp" style="display: inline;">' + getTimestamp() + '</span></div><div class="text" style="color: ' + MSG_COLOR + '">' + msg + '</div></div></div>');
        Plug.chatBox.scrollTop(Plug.chatBox.prop('scrollHeight'));
    };
    
    /*
    * Generate a timestamp similar to Plug's
    */
    var getTimestamp = function() {
        var d = new Date();
        var isNoon = (d.getHours() >= 12);
        var suffix = 'am';
        if (isNoon)
            suffix = 'pm';
        var modHours = d.getHours() % 12;
        var padMins;
        if (d.getMinutes() < 10)
            padMins = '0' + d.getMinutes();
        else
            padMins = d.getMinutes();
        return modHours + ':' + padMins + suffix;
    };
    
    /*
    * Toggle a mod function
    */
    var toggle = function(mod) {
        if (mod == Mod.AUTOJOIN) {
            settings.autoJoin.enabled = !settings.autoJoin.enabled;
            logMsg('Toggled AutoJoin to ' + settings.autoJoin.enabled + '!');
            if (settings.autoJoin.enabled)
                API.djJoin();
        }
        if (mod == Mod.AUTOWOOT) {
            settings.autoWoot.enabled = !settings.autoWoot.enabled;
            logMsg('Toggled AutoWoot to ' + settings.autoWoot.enabled + '!');
            if (settings.autoWoot.enabled)
                Plug.wootBtn.click();
        }
        if (mod == Mod.AUTOMEH) {
            settings.autoMeh.enabled = !settings.autoMeh.enabled;
            logMsg('Toggled AutoMeh to ' + settings.autoMeh.enabled + '!');
            if (settings.autoMeh.enabled)
                Plug.mehBtn.click();
        }
        if (mod == Mod.CHATALERT)
            settings.chatAlerts.enabled = !settings.chatAlerts.enabled;
        if (mod == Mod.DURALERT)
            settings.durationAlert.enabled = !settings.durationAlert.enabled;
        if (mod == Mod.IMPENDALERT)
            settings.upcomingAlert.enabled = !settings.upcomingAlert.enabled;
        if (mod == Mod.JOINALERT)
            settings.joinAlert.enabled = !settings.joinAlert.enabled;
        if (mod == Mod.TRACKSYN)
            settings.trackSynopsis.enabled = !settings.trackSynopsis.enabled;
        if (mod == Mod.TWITCHEMOTES)
            settings.twitchEmotes.enabled = !settings.twitchEmotes.enabled;
        if (mod == Mod.WOOTALERT)
            settings.wootAlert.enabled = !settings.wootAlert.enabled;
        updateSettingsDivs();
        saveSettings();
    };
    
    /*
    * Act upon the /bg command
    */
    var bgCommand = function(args) {
        if (!args) {
            plainMsg(commands.bg.help);
            return;
        }
        if (args.match(IMG_REGEX)) {
            settings.customBg.enabled = true;
            settings.customBg.uri = args;
            setBg(args);
        }
        else if (args === 'reset') {
            settings.customBg.enabled = false;
            resetBg();
        }
        else if (args === 'default') {
            settings.customBg.enabled = true;
            setBg('https://i.imgur.com/tOEACrk.png');
        }
        else
            plainMsg('Not a real URL to an image!');
    };
    
    /*
    * Change the background image
    */
    var setBg = function(uri) {
        $(document.getElementsByClassName('room-background')[0]).css('background', 'url(' + uri + ')');
        $(document.getElementsByClassName('background')[0].childNodes[0]).hide();
        Plug.playbackCont.css('border', 'solid 2px #111');
        Plug.playbackCont.css('box-shadow', '0 0 120px 12px #000');
    };
    
    /*
    * Set default background image
    */
    var resetBg = function() {
        $(document.getElementsByClassName('room-background')[0]).css('background', initialBg);
        $(document.getElementsByClassName('background')[0].childNodes[0]).show();
        Plug.playbackCont.css('border', 'none');
        Plug.playbackCont.css('box-shadow', 'none');
    };
    
    /*
    * Dump function help text
    */
    var displayHelp = function() {
        logMsg('Printing help text...');
        $.each(commands, function(i, obj) {
            plainMsg(obj.help);
        });
    };
    
    /*
    * Update settings divs based on current settings
    */
    var updateSettingsDivs = function() {
        XS.chatAlertBtn.find('i').css('display', getSettingDisplayMode(settings.chatAlerts));
        XS.durAlertBtn.find('i').css('display', getSettingDisplayMode(settings.durationAlert));
        XS.impendAlertBtn.find('i').css('display', getSettingDisplayMode(settings.upcomingAlert));
        XS.joinAlertBtn.find('i').css('display', getSettingDisplayMode(settings.joinAlert));
        XS.trackSynBtn.find('i').css('display', getSettingDisplayMode(settings.trackSynopsis));
        XS.twitchEmoteBtn.find('i').css('display', getSettingDisplayMode(settings.twitchEmotes));
        XS.wootAlertBtn.find('i').css('display', getSettingDisplayMode(settings.wootAlert));
    };
    
    /*
    * Get display mode for check mark on setting div
    */
    var getSettingDisplayMode = function(setting) {
        if (setting.enabled)
            return ItemDisplay.TRUE;
        return ItemDisplay.FALSE;
    };
    
    var getUrl = function(type) {
        if (IS_BETA) {
            switch (type) {
                case UrlType.SCRIPT:
                    return BetaUrls.SCRIPT_URL;
                case UrlType.STYLESHEET:
                    return BetaUrls.STYLESHEET_URL;
                case UrlType.BADGE:
                    return BetaUrls.BADGE_URL;
            }
        }
        else {
            switch (type) {
                case UrlType.SCRIPT:
                    return ScriptUrls.SCRIPT_URL;
                case UrlType.STYLESHEET:
                    return ScriptUrls.STYLESHEET_URL;
                case UrlType.BADGE:
                    return ScriptUrls.BADGE_URL;
            }
        }
    };
    
    /*
    * Build a user tag.
    */
    var tag = function(un) {
        return '@' + un;
    };
    
    /*
    * Check if a string contains a regex or another string
    */
    var containsString = function(str, find) {
        return (str.indexOf(find) > -1);
    };
    
    /*
    * Replace twitch emotes with inline images
    */
    var processTwitchEmotes = function(str) {
        var ret = '';
        var split = str.split('<br>');
        $.each(split, function(i, obj) {
            $.each(obj.split(/(\s)/), function(j, obj2) {
                var isEmote = false;
                $.each(TwitchEmotes.emotes, function(k, obj3) {
                    if (k == obj2) {
                        ret += getTwitchEmote(obj3, k);
                        isEmote = true;
                    }
                });
                if (!isEmote)
                    ret += obj2;
            });
            if (i !== split.length - 1)
                ret += '<br>';
        });
        return ret;
    };
    
    /*
    * Get a inline twitch emote object from a json object
    */
    var getTwitchEmote = function(emote, emoteName) {
        return '<img title="' + emoteName + '" id="twitch-' + emoteName + '" class="xscript-twitch-emote" src="' + TwitchEmotes.template.small.replace('{image_id}', emote.image_id) + '"></img>';
    };
    
    /*
    * W3Schools cookie setter
    */
    var setCookie = function(cname, cvalue) {
        document.cookie = cname + "=" + cvalue + ";";
    };

    /*
    * W3Schools cookie getter
    */
    var getCookie = function(cname) {
        var name = cname + "=";
        var ca = document.cookie.split(';');
        for(var i=0; i<ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1);
            if (c.indexOf(name) === 0) return c.substring(name.length, c.length);
        }
        return "";
    };
    
    // Settings object
    var settings = {
        autoJoin: {enabled: true},
        autoWoot: {enabled: false}, //TODO toggle buttons in some GUI
        autoMeh: {enabled: false},
        chatImg: {enabled: true, nsfw: false}, //TODO 
        twitchEmotes: {enabled: true}, //TODO implement
        trackSynopsis: {enabled: true},
        joinAlert: {enabled: true},
        wootAlert: {enabled: true},
        upcomingAlert: {enabled: true},
        durationAlert: {enabled: false, time: 10}, //TODO configurable
        chatAlerts: {enabled: false, triggers: []}, //TODO implement
        desktopNotifications: {enabled: true}, //TODO implement
        customBg: {enabled: true, uri: "http://i.imgur.com/tOEACrk.png"}
    };
    
    // Command mappings
    var commands = {
        kick: {func: unimplAlert, help: '/kick [user] - Kick the user from the community.'}, //TODO implement
        bg: {func: bgCommand, help: '/bg [url|reset|default] - Change the custom background.'},
        skip: {func: unimplAlert, help: '/skip - Attempt to skip the current DJ.'}, //TODO implement
        autojoin: {func: function() {toggle(Mod.AUTOJOIN);}, help: '/autojoin - Toggle autojoin.'},
        autowoot: {func: function() {toggle(Mod.AUTOWOOT);}, help: '/autowoot - Toggle autowoot.'},
        automeh: {func: function() {toggle(Mod.AUTOMEH);}, help: '/automeh - Toggle automeh.'},
        pm: {func: function() {logMsg('Ponymote Index: <a target="_blank" href="http://phantamanta44.github.io/ponymotes">http://phantamanta44.github.io/ponymotes</a>');}, help: '/pm - Display a link to an index of ponymotes.'},
        reload: {func: reloadScript, help: '/reload - Reload the script.'},
        disable: {func: function() {logMsg('Disabling xScript...'); initialized = false; destruct();}, help: '/disable - Unload the script.'},
        xshelp: {func: displayHelp, help: '/xshelp - Display commands.'}
    };
    
    // Check if on Plug
    if (document.location.host !== 'plug.dj' || !API)
        alert('xScript must be loaded in a Plug room!');
    else
        init();
    
}
