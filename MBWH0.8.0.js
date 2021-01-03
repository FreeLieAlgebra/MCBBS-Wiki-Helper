/* MCBBS Wiki Helper 0.8.0 */
/* By FreeLieAlgebra */


/* Wikiplus */
mw.loader.load('https://wikiplus-app.com/Main.js')
/* lib
----------------------------------------------------------------------
*/
function getTitle() {
    return mw.config.get("wgPageName");
}

function getPatrolToken(func) {
$.ajax({url: "/api.php?action=query&meta=tokens&format=json&type=patrol", type: "GET", success: function(data){func(data.query.tokens.patroltoken);}})
}

function getCsrfToken(func) {
$.ajax({url: "/api.php?action=query&meta=tokens&format=json&type=csrf", type: "GET", success: function(data){func(data.query.tokens.csrftoken);}})
}

function getRollbackToken(func) {
$.ajax({url: "/api.php?action=query&meta=tokens&format=json&type=rollback", type: "GET", success: function(data){func(data.query.tokens.rollbacktoken);}})
}

function getWikiText(title, func) {
$.ajax({url: "/api.php?action=query&prop=revisions&titles=" + title + "&rvprop=content&indexpageids=true&format=json", type: "GET", success: function(data){func(data.query.pages[data.query.pageids[0]].revisions[0]["*"]);}})
}

function getRevIds(func) {
    $.ajax(
        {url: "/api.php?action=query&prop=revisions&titles="+ title + "&rvlimit=20&rvprop=ids&format=json", type: "GET", success: function(data){
            var revisionslist = data.query.pages[pageid.toString()].revisions; 
            var revli = []; 
            for(i = 0; revisionslist[i]; i +=1) 
                {revli[i] = revisionslist[i].revid;} 
            func(revli);}
        }
    )
}
function searchWiki(text, func){
    $.ajax({url: "/api.php?action=query&format=json&list=search&srsearch=" + text + "&srlimit=max&srwhat=text&srprop=", type: "GET", success:
        function(data){
        var res = data.query.search, res2 = []; 
        for(i = 0; res[i]; i += 1)
            {res2[i]=res[i].title;}
        func(res2);}
    });
}

function patrolRevision (patroltoken, revid){
$.ajax({url: "/api.php?action=patrol&format=json", type: "POST", data: {"token" : patroltoken, "revid" : revid}});
}

function editPage(title, summary, minor, text, csrftoken){
    var bot = "";
    if ("bot" in mw.config.get("wgUserGroups")) {
        bot = "true";
    }
    $.ajax({url:"/api.php?action=edit&format=json", type:"POST", data: {title: title, summary: summary, minor: minor, bot:bot, basetimestamp: "now", text: text, token: csrftoken}});
}

function movePage (from, to, reason, csrftoken, func) {
    $.ajax({url:"/api.php?action=move", data: {from:from, to: to, reason: reason, token:csrftoken}, type: "POST", success: function(data){func(data);}});
}

function getLinksHere(title, func) {
    $.ajax({url: "/api.php?action=query&prop=linkshere&lhnamespace=*&lhlimit=max&lhprop=title&indexpageids=true&format=json&titles=" + title, type: "GET", success: function(data)
        {var res = data.query.pages[data.query.pageids[0]].linkshere, res2 = [];
        for (i = 0; res[i]; i += 1){
            res2[i] = res[i].title;
            }
        func(res2);
        }
    });
}

function getCats(func) {
    $.ajax(
        {url: "/api.php?action=query&prop=categories&titles="+ title + "&format=json", type: "GET", success: function(data){
            var catList = data.query.pages[pageid.toString()].categories; 
            var catli = []; 
            for(i = 0; catList[i]; i +=1) 
                {catli[i] = catList[i].title;} 
            func(catli);}
        }
    );
}

/* ------ action functions------*/

function patrolAll() {
    getRevIds(function (revli) {
        getPatrolToken(function (patroltoken) {
            for(i = 0; revli[i]; i += 1){
                patrolRevision(patroltoken, revli[i]);
            }
        });
    });
}

function inPageAPITest(){
    var option = prompt("请输入测试项目", "wgPageName");
    if (option != null) {
        var result = mw.config.get(option);
        prompt("结果：", result);
    }
}

function addCats() {
    getCats(function (catList) {
        var pageFootHTML = '<div class="mbwh-mb-pf-cat"><br/><br/><a href="/wiki/特殊:分类">分类</a>：<ul>';
        for(i = 0; catList[i]; i += 1){
            pageFootHTML += ('<li><a href="/wiki/' + catList[i] + '">' + catList[i] + '</a></li>');
        }
        pageFootHTML += '</ul></div>';
        $("#bodyContent").append(pageFootHTML);
   });
}



function replaceText(title, org, subst, summary) {
    if (summary == undefined){summary = "";}
    getCsrfToken(function (csrftoken) {
        getWikiText(title, function (wikiText) {
                var changedText = wikiText.split(org).join(subst);
                editPage(title, summary, "true", changedText, csrftoken);
        });
    });
}


function massSearchReplace (org, subst) {
    searchWiki(org, function (pageTitleList) {
        for (i = 0; pageTitleList[i]; i += 1)
            {replaceText(pageTitleList[i], org, subst, "批量搜索替换“" + org + "”为“" + subst + "”，第" + i + "个");}
    });
}

function massSearchReplacePrompt (){
    var org = prompt("org");
    var subst = prompt("subst");
    if (prompt("Continue?") != null)
        {massSearchReplace(org, subst);}
}

function deepMove (from, to, reason) {
    getCsrfToken(function (csrftoken) {
        movePage(from, to, reason, csrftoken, function(data){
            getLinksHere(from, function (pageList) { 
                for (i = 0; pagelist[i]; i += 1){
                    replaceText(pageList[i], "[[" + from + "]]", "[[" + to + "]]", "// DeepMove by MBWH");
                    }
            });
        });
    });
}

function deepMovePrompt(){
    var from = prompt("From:", title);
    var to = prompt("To:");
    var reason = prompt("Reason:");
    if (prompt("Continue?") != null)
        {deepMove(from, to, reason);}
}
/* 一些变量
----------------------------------------------------------------------
*/
var title, res1, pageid;
title = getTitle();
res1 = "/wiki/Special:WhatLinksHere/" + title;
pageid = mw.config.get("wgArticleId");

/* 电脑版 
----------------------------------------------------------------------
*/
/* 右上角添加 */
$('#p-personal ul').append('<li><a href="?action=purge">强制刷新</a></li>');
$('#p-personal ul').append('<li><a href="?action=info">info</a></li>');
$('#p-personal ul').append('<li><a href="' + res1 + '">WhatLinksHere</a></li>');

$('#p-help ul').empty();
$('#p-help ul').append('<div class="mbwh-pc-ph-btn"><li class=""><button onclick="getRevIds(window.alert);">getRevIds</button></li><li class=""><button onclick="patrolAll();">patrolAll</button></li><li class=""><button onclick="inPageAPITest();">inPageAPITest</button></li><li class=""><button onclick="massSearchReplacePrompt();">批量搜索替换</button></li><li class=""><button onclick="deepMovePrompt();">DeepMove</button></li></div>');


/* 手机版 
----------------------------------------------------------------------
*/

/* 手机版编辑栏添加 */
$('#page-actions').append('<li class=""><a href="?action=purge" >purge</a></li>');
/* 手机版左端导航添加 */

$('#mw-mf-page-left').append('<div class="mbwh-mb-pl-btn"><li class=""><a href="' + res1 + '">WhatLinksHere</a></li><li class=""><a href="?action=info">info</a></li><li class=""><button onclick="getRevIds(window.alert);">getRevIds</button></li><li class=""><button onclick="patrolAll();">patrolAll</button></li><li class=""><button onclick="inPageAPITest();">inPageAPITest</button></li><li class=""><button onclick="massSearchReplacePrompt();">批量搜索替换</button></li><li class=""><button onclick="deepMovePrompt();">DeepMove</button></li></div>');

/* 手机版页底添加分类 */
addCats();
