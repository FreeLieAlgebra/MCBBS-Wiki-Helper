/* MCBBS Wiki Helper 0.7.0 */
/* By FreeLieAlgebra */


/* Wikiplus */
mw.loader.load('https://wikiplus-app.com/Main.js')
/* lib
----------------------------------------------------------------------
*/
function getTitle() {
    return mw.config.get("wgPageName")
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


/* done */
function patrolAll() {
    getRevIds(function (revli) {
        getPatrolToken(function (patroltoken) {
            for(i = 0; revli[i]; i += 1){
                //post patrol
                $.ajax({url: "/api.php?action=patrol&format=json", type: "POST", data: {"token" : patroltoken, "revid" : revli[i]}, processData: true, success: function(data){"console.log(data);alert(JSON.stringify(data))"}});
            }
        });
    });
}

/* done */
function inPageAPITest(){
    var option = prompt("请输入测试项目", "wgPageName");
    if (option != null) {
        var result = mw.config.get(option);
        prompt("结果：", result);
    }
}

/* done */
function addCats() {
    $.ajax(
        {url: "/api.php?action=query&prop=categories&titles="+ title + "&format=json", type: "GET", success: function(data){
            var catlist = data.query.pages[pageid.toString()].categories; 
            var pageFootHTML = '<div class="mbwh-mb-pf-cat"><br/><br/><a href="/wiki/特殊:分类">分类</a>：<ul>';
            for(i = 0; catlist[i]; i += 1){
                pageFootHTML += ('<li><a href="/wiki/' + catlist[i].title + '">' + catlist[i].title + '</a></li>');
                }
            pageFootHTML += '</ul></div>';
            $("#bodyContent").append(pageFootHTML);
            }
        }
    )
}

/* done */
function replaceText(title, org, subst, summary) {
    if (summary == undefined){summary = "";}
    getCsrfToken(function (csrftoken) {
        getWikiText(title, function (wikiText) {
                var changedText = wikiText.split(org).join(subst)
                $.ajax({url:"/api.php?action=edit&format=json", type:"POST", data: {title: title, summary: summary, minor: "true", basetimestamp: "now", text: changedText, token: csrftoken}, success: function(data){console.log(JSON.stringify(data));}});
        })
    })
}

/* part-done */
function massReplace (org, subst) {
    $.ajax({url: "/api.php?action=query&format=json&list=search&srsearch=" + org + "&srlimit=max&srwhat=text&srprop=", type: "GET", success: function (data) {
        var results = data.query.search;
        for (i = 0; results[i]; i += 1)
            {replaceText(results[i].title, org, subst, "批量替换“" + org + "”为“" + subst + "”，第" + i + "个");}
        }
    });
}

/* done */
function massReplacePrompt (){
    var org = prompt("org");
    var subst = prompt("subst");
    if (prompt("Continue?") != null)
        {massReplace(org, subst);}
}

/* part-done */
/* To be replaced by linkshere */
function deepMove(from, to, reason){
    getCsrfToken(function (csrftoken) {
        $.ajax({url:"/api.php?action=move", data: {from:from, to: to, reason: reason, token:csrftoken}, type: "POST", success: function(){
            massReplace("[[" + from + "]]", "[[" + to + "]]"); // Key part
        }});
    });
}

/* done */
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
var title, res1, pageid
title = getTitle()
res1 = "/wiki/Special:WhatLinksHere/" + title
pageid = mw.config.get("wgArticleId")
/* 电脑版 
----------------------------------------------------------------------
*/
/* 右上角添加 */
$('#p-personal ul').append('<li><a href="?action=purge">强制刷新</a></li>')
$('#p-personal ul').append('<li><a href="?action=info">info</a></li>')
$('#p-personal ul').append('<li><a href="' + res1 + '">WhatLinksHere</a></li>')

/* 手机版 
----------------------------------------------------------------------
*/

/* 手机版编辑栏添加 */
$('#page-actions').append('<li class=""><a href="?action=purge" >purge</a></li>')
/* 手机版左端导航添加 */

$('#mw-mf-page-left').append('<div class="mbwh-mb-pl-btn"><li class=""><a href="' + res1 + '">WhatLinksHere</a></li><li class=""><a href="?action=info">info</a></li><li class=""><button onclick="getRevIds(window.alert);">getRevIds</button></li><li class=""><button onclick="patrolAll();">patrolAll</button></li><li class=""><button onclick="inPageAPITest();">inPageAPITest</button></li><li class=""><button onclick="massReplacePrompt();">批量替换</button></li><li class=""><button onclick="deepMovePrompt();">DeepMove</button></li></div>')

/* 手机版页底添加分类 */
addCats()
