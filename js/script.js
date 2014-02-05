var server = "ircbox.cs.fau.de";	//The server address
var ipv4serveraddress = "131.188.30.49"; //The server ipv4 address (for opt in)
var port = 1338;				//the server port

$.cookie.json = true;
$.cookie.defaults.expires = 365;

//Redraws the map when a cip button is clicked
function redrawMap(element){
	fadeOutAndRemove(".kiste, .door");
	window.setTimeout("drawMap(\""+$(element).attr("data-cip")+"\")", 400);
	
	$(".current").removeClass("current");
	$(element).addClass("current");
	
	location.hash=$(element).attr("data-cip");
}

//gets the data from the server and calls decorate afterwards
function getTheData(){
	$.ajax("http://"+server+":"+port+"/getData",{
		dataType:"jsonp",
		success: function(data){if(data.error != undefined) alert(data.error); else decorate(data)},
		beforeSend: function(){$(".loadimage").addClass("rotating");},
		complete: function(){$(".loadimage").removeClass("rotating");},
		timeout: 4000,
		error: function(a,e,i){alert("An unknown error occured:"+e);},
		//statusCode: { 
		//	403: function(){ alert("Daten können (vorerst) nur aus dem Uninetz erreicht werden."); }
		//	}
		});
}	

//Draws the map
function drawMap(cip) {
	getTheData();	
	
	//Get the current map from dictionary(cip => map)
	var curMap = eval("map."+cip);
	
	mapWidth = 0;
	mapHeight = 0;
	
	for(i=0; i<curMap.length;i++){
		var d = document.createElement("div");
		
		//Set new element's attributes and append to main content div
		$("#mainContent").append(
			$(d).css({"display": "none", "top": curMap[i].y*110+20, "left": curMap[i].x*110+20}).
				addClass("kiste").
				attr("id", curMap[i].id).
				html("<span class=\"name\">"+curMap[i].name+"</span><br/ ><span class=\"innerText\"></span>")
			);
		
		if((curMap[i].x+1)*110+10 > mapWidth)
			mapWidth = (curMap[i].x+1)*110+10+20;
			
		if((curMap[i].y+1)*110+10 > mapHeight)
			mapHeight = (curMap[i].y+1)*110+10+20;
	}
	
	//set container to content size
	$("#mainContent").height(mapHeight);
	$("#mainContent").width(mapWidth);
	
	//insert door
	var door = eval("map.doors."+cip);
	if(door){
		leftOffset = [0, door.offset*110+20-55, mapWidth-9, door.offset*110+20-55];
		topOffset = [door.offset*110+20-55, mapHeight-9, door.offset*110+20-55,0];
		
		$("#mainContent").append(
			$(document.createElement("div")).css({
				"display": "none",
				 "height": (door.position%2)?10:200,
				 "width":!(door.position%2)?10:200,
				 "left": leftOffset[door.position],
				 "top": topOffset[door.position]
				 }).addClass("door")
			);
		$("#doorPreselect").children("option").prop("selected",false);
		if($.cookie("rotate_"+cip) != undefined){
			$($("#doorPreselect").children("option")[parseInt($.cookie("rotate_"+cip))]).prop("selected",true);
		}else{
			$($("#doorPreselect").children("option")[door.position]).prop("selected",true);
		}
		
	}
	rotateMap();
	$(".kiste, .door").fadeIn(300);
	
	$("#mainContent").mousemove(function (event) {
	
		var height = $(this).height();
		var width = $(this).width();
		var left = $(this).offset().left;
		var top = $(this).offset().top;
		var x = event.pageX;
		var y = event.pageY;
		var rot = parseInt($('option:selected', $("#doorPreselect")).val()) + door.position;
		var lightUp = null;
		
		
		if(Math.abs(x - left) < 20){
			lightUp = 0;	
			
		}else if( (rot%2 == 0 && Math.abs(left + width  - x) < 20 )
		        ||(rot%2 == 1 && Math.abs(left + height - x) < 20 )){
			lightUp = 2;
			
		}else if(Math.abs(y - top) < 20){
			lightUp = 3;
			
		}else if( (rot%2 == 0 && Math.abs(top + height - y) < 20) 
		        ||(rot%2 == 1 && Math.abs(top + width  - y) < 20)){
			lightUp = 1;
		}
		
		$(this).css("box-shadow", "none");
		$(this).css("cursor", "auto");
		$(this).css("border-color", "darkgray");
		$(this).attr("title", "");
		
		if(lightUp != null){
			var box_shadows = new Array("inset 2px 0px 1px #00a0ff", "inset 0px -2px 1px #00a0ff", "inset -2px 0px 1px #00a0ff", "inset 0px 2px 1px #00a0ff");
			var border_names = new Array("border-left-color", "border-bottom-color", "border-right-color", "border-top-color");
			
			$(this).css("border-color", "darkgray");
			$(this).css("box-shadow", "none");
			$(this).css("box-shadow", box_shadows[(lightUp + door.position - parseInt($('option:selected', $("#doorPreselect")).val()) + 4)%4]);
			$(this).css(border_names[(lightUp + door.position - parseInt($('option:selected', $("#doorPreselect")).val()) + 4)%4], "#00a0ff");
			
			$(this).css("cursor", "pointer");
			$(this).attr("title", "Click here to rotate the map and put the door on this edge");
			
		}
	});
	
	$("#mainContent").mouseleave(function(event){
			$(this).css("box-shadow", "none");
			$(this).css("cursor", "auto");
			$(this).css("border-color", "darkgray");
			$(this).attr("title", "");
	});
	
	$("#mainContent").click(function (event) {
		var height = $(this).height();
		var width = $(this).width();
		var left = $(this).offset().left;
		var top = $(this).offset().top;
		var x = event.pageX;
		var y = event.pageY;
		var rot = parseInt($('option:selected', $("#doorPreselect")).val()) + door.position;
		var lightUp = null;
		
		
		//left = 0
		//bottom = 1
		//right = 2
		//top = 3
		if(Math.abs(x - left) < 20){
			//Near left border
			$("#doorPreselect option[value='0']").prop('selected',true);
			rotateMap();
			$(this).mousemove();	
			
		}else if( (rot%2 == 0 && Math.abs(left + width  - x) < 20 )
		        ||(rot%2 == 1 && Math.abs(left + height - x) < 20 )){
			//Near right border
			$("#doorPreselect option[value='2']").prop('selected',true);
			rotateMap();
			$(this).mousemove();
			
		}else if(Math.abs(y - top) < 20){
			//Near top border
			$("#doorPreselect option[value='3']").prop('selected',true);
			rotateMap();
			$(this).mousemove();
			
		}else if( (rot%2 == 0 && Math.abs(top + height - y) < 20) 
		        ||(rot%2 == 1 && Math.abs(top + width  - y) < 20)){
			//Near bottom border
			$("#doorPreselect option[value='1']").prop('selected',true);
			rotateMap();
			$(this).mousemove();
		}
	});
}

//Draws the map on first load
function drawMapFirst(){
	var hashMap = location.hash.substr(1);
	
	//if there is a valid map saved in the hashtag
	$("#leftpane-"+hashMap).addClass("current");
	if(hashMap != "" && eval("map."+hashMap)){
		drawMap(hashMap);
	}else{
		$("#leftpane-cip2").addClass("current");
		drawMap("cip2");
	}
	
	window.setTimeout("keepUpdated()",1000*60);
}

function keepUpdated(){
	if($("#keepUpdated").prop("checked")){
		getTheData();
	}
	window.setTimeout("keepUpdated()",1000*60);
}

//Sets the machines' state (free, occupied, no information) and starts the ageTimer
var ageTimer;
function decorate(data){
	$.each($(".kiste"), function (index, value) {
		$(value).removeClass("free occupied");

		occ = eval("data."+$(value).attr("id"));
		
		//No information or a sunray
		if(occ == undefined){
			if($(value).children(".name").html() == "Sunray")
				$(value).addClass("free");
			return;
		}
		
		secs = parseTime(occ.information);
		
		//Server has not updated its information for a long time
		if(occ.information.indexOf("probably outdated") != -1){
			$(value).children(".innerText").html("Cipmap ser&shy;ver in&shy;oper&shy;able since <span class=\"ageTimer\" data-seconds=\""+secs+"\" title=\"Server said: "+occ.information+"\"></span>");
			return;
		}
		
		if(occ.occupied){
			$(value).addClass("occupied");
			
			if(occ.personname != ""){
				$(value).children(".innerText").html("User: <acronym title=\""+occ.persongroup+"\">"+occ.personname+"</acronym><br/ >Last update: <span class=\"ageTimer\" data-seconds=\""+secs+"\" title=\"Server said: "+occ.information+"\"></span>");
			}else{
				$(value).children(".innerText").html("User: <acronym title=\"Der Nutzer hat der Veröffentlichung seines Nutzernamens nicht zugestimmt.\">N/A</acronym><br/ >Last update: <span class=\"ageTimer\" data-seconds=\""+secs+"\" title=\"Server said: "+occ.information+"\"></span>");
			}
		}else{
			$(value).addClass("free");
			$(value).children(".innerText").html("");
			
			//The server has not reached the machine for some time
			if(occ.information.indexOf("never reached") != -1){
				$(value).children(".innerText").html("Pro&shy;ba&shy;bly turned off<br / >Last update: <span class=\"ageTimer\" data-seconds=\""+secs+"\" title=\"Server said: "+secs+" "+occ.information+"\"></span>");
				
			}
		}
	});
	//Increase and display the times now and once every second
	increaseTimes();
	window.clearInterval(ageTimer);
	ageTimer = window.setInterval("increaseTimes()",1000);
}

//Calculates a human readable time and displays it in all .ageTimer elements
function increaseTimes(){
	$.each($(".ageTimer"), function(index, value){
		elem = $(value);
		
		secs = parseInt(elem.attr("data-seconds"));
		y = parseInt(secs/365/24/60/60);
		if(secs/365/24/60/60 < 1) y = 0; //workaround for a weird javascript bug
		secs -= y*365*24*60*60;
		d = parseInt(secs/24/60/60);
		secs -= d*24*60*60;
		h = parseInt(secs/60/60);
		secs -= h*60*60;
		m = parseInt(secs/60);
		s = secs - m*60;
		
		elem.html("");
		if(y!=0) elem.html(elem.html()+y+"y ");
		if(d!=0) elem.html(elem.html()+d+"d ");
		if(h!=0) elem.html(elem.html()+h+"h ");
		if(m!=0) elem.html(elem.html()+m+"m ");

		//Displaying seconds is too distracting
		if($("#showSeconds").prop('checked')){
			elem.html(elem.html()+s+"s ");
		}else{		
			if(y+d+h+m==0) elem.html(elem.html()+"<1m");
		}
		
		elem.attr("data-seconds", parseInt(elem.attr("data-seconds"))+1);
	});
}

//rotates the map so that the door is on the user's favorite position
function rotateMap(){
	desiredPosition = $('option:selected', $("#doorPreselect")).val();
	
	door = eval("map.doors."+$(".leftpane.current").attr("data-cip"));
	if(door){
		//reset basically everything, so that no weird things happen
		foo = document.getElementById("mainContentContainer").scrollTop;
		document.getElementById("mainContentContainer").scrollTop=0;
		$("#mainContent").css({top:0,left:0});
		
		$(".kiste").css("transform", "rotate("+90*(desiredPosition-door.position)+"deg)");
		$("#mainContent").css("transform", "rotate("+90*(door.position-desiredPosition)+"deg)");
		
		$(".kiste").css("-webkit-transform", "rotate("+90*(desiredPosition-door.position)+"deg)");
		$("#mainContent").css("-webkit-transform", "rotate("+90*(door.position-desiredPosition)+"deg)");
		
		after = $("#mainContent").position();
		$("#mainContent").css({top:-after.top,left:-after.left});
		document.getElementById("mainContentContainer").scrollTop=foo;
		
		//save the setting
		$.cookie("rotate_"+$(".leftpane.current").attr("data-cip"), desiredPosition);
	}
}

/*
 * Stuff for the opt-in page
 */
 
//Submits an opt-in and waits displays the answer
function submitOptIn(){
	//ipv4 only :(
	$.ajax("http://"+ipv4serveraddress+":"+port+"/optIn?username="+$("#usernamefield").val(),{
		dataType:"jsonp",
		success: function(data){
			$("#confirmation").css("text-decoration", "line-through");
			if(data.error != undefined){
				$("#errormessage").html("Error: "+data.error);
			}else{
				$("#successmessage").html("Success!");
			}
		},	
		beforeSend: function(){$("li .loadimage").css("visibility", "visible");},
		complete: function(){$(".loadimage").css("visibility", "hidden");},
		timeout: 10000,
		error: function(a,e,i){if(e=="timout"){
				alert("Could not download latest data. Are you inside the university network? See FAQ.");
			}else{
				alert("An unknown error occured:"+e);
			}},
		//statusCode: { 
		//	403: function(){ alert("Daten können (vorerst) nur aus dem Uninetz erreicht werden."); }
		//	}
		});
	return false;
}

/*
 * Some simple helper stuff
 */

//Fades an element out and then removes it from the DOM
function fadeOutAndRemove(elem){
	$(elem).fadeOut(300, function() { $(this).remove(); });
}

//Parses a time string in the form NNNNd(ays) MMh(ours) OOm(ins) PPs(econds)
function parseTime(string){
	var secs = 0;
	var accu = 0;
	var decimal = 0;
	for(i=0;i<string.length;i++){
		c = string.charAt(i);
		if(c >= '0' && c <= '9'){
			accu *= 10*decimal++;
			accu += c - '0';
			
		}else{
			switch(c){
				case 'y': accu *= 365;
				case 'd': accu *= 24;
				case 'h': accu *= 60;
				case 'm': accu *= 60;
				case 's': secs += accu;
				default : accu = 0;
					  decimal=0;
			}
		}
	}
	return secs;
}

function initSettings(){
	if($.cookie('keepUpdated'))
		$("#keepUpdated").prop("checked", true);
	
	if($.cookie('showSeconds'))
		$("#showSeconds").prop("checked", true);
	
	if($.cookie('colloquialNames'))
		$("#colloquialNames").prop("checked", true);
}

function colloquialNames(name){
	names = {cip2:["CIP2", "02.151"],
		 bibcip:["Bibcip", "02.153"],
		 cip1:["CIP1", "01.155"],
		 wincip:["Wincip", "01.153"],
		 stfucip:["STFUcip", "00.153"],
		 gracip:["CIP4", "00.156"],
		 huber:["Huber", "0.01-142"]
		}
	$(".leftpane").each(function(){
		if($(this).attr("data-cip") && eval("names."+$(this).attr("data-cip"))){
			if($.cookie('colloquialNames')){
				$(this).children(".name").html(eval("names."+$(this).attr("data-cip"))[0])
			}else{
				$(this).children(".name").html(eval("names."+$(this).attr("data-cip"))[1])
			}
		}
	});
}
