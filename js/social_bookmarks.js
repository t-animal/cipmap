(function($){
	"use strict";
	/*
	 * helper functions
	 */

	// abbreviate at last blank before length and add "\u2026" (horizontal ellipsis)
	function abbreviateText(text, length) {
		var abbreviated = decodeURIComponent(text);

		if(abbreviated.length <= length) {
			return text;
		}

		var lastWhitespaceIndex = abbreviated.substring(0, length - 1).lastIndexOf(' ');
		abbreviated = encodeURIComponent(abbreviated.substring(0, lastWhitespaceIndex)) + "\u2026";

		return abbreviated;
	}

	// returns content of <meta name="" content=""> tags or '' if empty/non existant
	function getMeta(name) {
		var metaContent = $('meta[name="' + name + '"]').attr('content');

		return metaContent || '';
	}

	// create tweet text from content of <meta name="DC.title"> and <meta name="DC.creator">
	// fallback to content of <title> tag
	function getTweetText() {
		var title = getMeta('DC.title');
		var creator = getMeta('DC.creator');

		if((title.length > 0) && (creator.length > 0)) {
			title += ' - ' + creator;
		} else {
			title = $('title').text();
		}

		return encodeURIComponent(title);
	}

	// build URI from rel="canonical" or document.location
	function getURI() {
		var uri = document.location.href;
		var canonical = $("link[rel=canonical]").attr("href");

		if(canonical && (canonical.length > 0)) {
			if(canonical.indexOf("http") < 0) {
				canonical = document.location.protocol + "//" + document.location.host + canonical;
			}

			uri = canonical;
		}

		return uri;
	}

	function cookieSet(name, value, days, path, domain) {
		var expires = new Date();

		expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
		document.cookie = name + '=' + value + '; expires=' + expires.toUTCString() + '; path=' + path + '; domain=' + domain;
	}

	function cookieDel(name, value, path, domain) {
		var expires = new Date();

		expires.setTime(expires.getTime() - 100);
		document.cookie = name + '=' + value + '; expires=' + expires.toUTCString() + '; path=' + path + '; domain=' + domain;
	}

	$.fn.socialSharePrivacy = function(options) {
		var defaults = {
			'services' : {
				'facebook' : {
					'status'			: 'on',
					'txt_info'			: '2 Klicks für mehr Datenschutz: Erst wenn Sie hier klicken, wird der Button aktiv und Sie können Ihre Empfehlung an Facebook senden. Schon beim Aktivieren werden Daten an Dritte übertragen - siehe <em>i</em>.',
					'txt_fb_off'		: 'nicht mit Facebook verbunden',
					'txt_fb_on'			: 'mit Facebook verbunden',
					'perma_option'		: 'off',
					'display_name'		: 'Facebook',
					'referrer_track'	: '',
					'language'			: 'de_DE',
					'action'			: 'recommend'
				},
				'twitter' : {
					'status'			: 'on',
					'txt_info'			: '2 Klicks für mehr Datenschutz: Erst wenn Sie hier klicken, wird der Button aktiv und Sie können Ihre Empfehlung an Twitter senden. Schon beim Aktivieren werden Daten an Dritte übertragen - siehe <em>i</em>.',
					'txt_twitter_off'	: 'nicht mit Twitter verbunden',
					'txt_twitter_on'	: 'mit Twitter verbunden',
					'perma_option'		: 'off',
					'display_name'		: 'Twitter',
					'reply_to'			: '',
					'tweet_text'		: 'Schamlose Werbung fuer http://cipmap.t-animal.de by @t_animal',
					'referrer_track'	: 'utm_medium=twitter&utm_source=2-click-twitter-button&utm_term=2ClickTweetButton&utm_campaign=',
					'language'			: 'de'
				},
				'gplus' : {
					'status'			: 'on',
					'txt_info'			: '2 Klicks für mehr Datenschutz: Erst wenn Sie hier klicken, wird der Button aktiv und Sie können Ihre Empfehlung an Google+ senden. Schon beim Aktivieren werden Daten an Dritte übertragen - siehe <em>i</em>.',
					'txt_gplus_off'		: 'nicht mit Google+ verbunden',
					'txt_plus_on'		: 'mit Google+ verbunden',
					'perma_option'		: 'off',
					'display_name'		: 'Google+',
					'referrer_track'	: '',
					'plusone_lib'		: ''
				},
				'flattr' : {
					'status'			: 'on',
					'uid'				: 't.animal',
					'txt_info'			: '2 Klicks für mehr Datenschutz: Erst wenn Sie hier klicken, wird der Button aktiv und Sie können Ihre Empfehlung an Flattr senden. Schon beim Aktivieren werden Daten an Dritte übertragen - siehe <em>i</em>.',
					'txt_flattr_off'	: 'nicht mit Flattr verbunden',
					'txt_flattr_on'		: 'mit Flattr verbunden',
					'perma_option'		: 'off',
					'display_name'		: 'Flattr',
					'the_title'			: 'CIPMap',
					'referrer_track'	: '',
					'uri'			: 'http://cipmap.t-animal.de',
					'the_excerpt'		: 'Stellt die CIP-Pools der FAU graphisch dar und zeigt, welche Rechner frei sind.'
				},
				'xing' : {
					'status'			: 'off',
					'txt_info'			: '2 Klicks für mehr Datenschutz: Erst wenn Sie hier klicken, wird der Button aktiv und Sie können Ihre Empfehlung an Xing senden. Schon beim Aktivieren werden Daten an Dritte übertragen - siehe <em>i</em>.',
					'txt_xing_off'		: 'nicht mit Xing verbunden',
					'txt_xing_on'		: 'mit Xing verbunden',
					'perma_option'		: 'off',
					'display_name'		: 'Xing',
					'referrer_track'	: 'utm_medium=xing&utm_source=2-click-xing-button&utm_term=2ClickXingButton&utm_campaign=',
					'language'			: 'de'
				},
				'pinterest' : {
					'status'			: 'off',
					'the_excerpt'		: '',
					'txt_info'			: '2 Klicks für mehr Datenschutz: Erst wenn Sie hier klicken, wird der Button aktiv und Sie können Ihre Empfehlung an Pinterest senden. Schon beim Aktivieren werden Daten an Dritte übertragen - siehe <em>i</em>.',
					'txt_pinterest_off'	: 'nicht mit Pinterest verbunden',
					'txt_pinterest_on'	: 'mit Pinterest verbunden',
					'perma_option'		: 'off',
					'display_name'		: 'Pinterest',
					'referrer_track'	: '',
					'media'				: ''
				},
				't3n' : {
					'status'			: 'off',
					'txt_info'			: '2 Klicks für mehr Datenschutz: Erst wenn Sie hier klicken, wird der Button aktiv und Sie können Ihre Empfehlung an Pinterest senden. Schon beim Aktivieren werden Daten an Dritte übertragen - siehe <em>i</em>.',
					'txt_t3n_off'		: 'nicht mit t3n verbunden',
					'txt_t3n_on'		: 'mit t3n verbunden',
					'perma_option'		: 'off',
					'display_name'		: 't3n',
					'referrer_track'	: ''
				},
				'linkedin' : {
					'status'			: 'off',
					'txt_info'			: '2 Klicks für mehr Datenschutz: Erst wenn Sie hier klicken, wird der Button aktiv und Sie können Ihre Empfehlung an Pinterest senden. Schon beim Aktivieren werden Daten an Dritte übertragen - siehe <em>i</em>.',
					'txt_linkedin_off'	: 'nicht mit LinkedIn verbunden',
					'txt_linkedin_on'	: 'mit LinkedIn verbunden',
					'perma_option'		: 'off',
					'display_name'		: 'LinkedIn',
					'referrer_track'	: ''
				}
			},
			'info_link'					: 'http://www.heise.de/ct/artikel/2-Klicks-fuer-mehr-Datenschutz-1333879.html',
			'txt_help'  				: 'Wenn Sie diese Felder durch einen Klick aktivieren, werden Informationen an Facebook, Twitter, Flattr oder Google ins Ausland übertragen und unter Umständen auch dort gespeichert. Näheres erfahren Sie durch einen Klick auf das <em>i</em>.',
			'settings_perma'			: 'Dauerhaft aktivieren und Datenüber-tragung zustimmen:',
			'cookie_path'				: '/',
			'cookie_domain'				: document.location.host,
			'cookie_expires'			: '365',
			'uri'						: getURI,
			'post_id'					: '',
			'post_title_referrer_track'	: '',
			'concat'					: '',
			'display_infobox'			: 'off'
		};

		var options = $.extend(true, defaults, options);

		var facebook_on 	= (options.services.facebook.status === 'on');
		var twitter_on  	= (options.services.twitter.status  === 'on');
		var gplus_on		= (options.services.gplus.status === 'on');
		var flattr_on		= (options.services.flattr.status === 'on');
		var xing_on			= (options.services.xing.status === 'on');
		var pinterest_on	= (options.services.pinterest.status === 'on');
		var t3n_on			= (options.services.t3n.status === 'on');
		var linkedin_on		= (options.services.linkedin.status === 'on');

		// check if at least one service is "on"
		if(!facebook_on && !twitter_on && !gplus_on && !flattr_on && !xing_on && !pinterest_on && !t3n_on && !linkedin_on) {
			return;
		}

		$(this).prepend('<ul class="social_share_privacy_area_' + options.post_id + '"></ul>');
		var context = $('.social_share_privacy_area_' + options.post_id, this);

		// canonical uri that will be shared
		var uri = options.uri;

		if(typeof uri === 'function') {
			uri = uri();
		}

		return this.each(function(){
			//
			// Facebook
			//
			if(facebook_on) {
				var fb_ref_track = '';
				if(options.services.facebook.referrer_track != '') {
					fb_ref_track = options.concat;// + encodeURIComponent(options.services.facebook.referrer_track + options.post_title_referrer_track);
				}

				var fb_enc_uri = encodeURIComponent(uri);
				var fb_code = '<iframe src="https://www.facebook.com/plugins/like.php?locale=' + options.services.facebook.language + '&amp;href=' + fb_enc_uri + '&amp;send=false&amp;layout=button_count&amp;width=120&amp;show_faces=false&amp;action=' + options.services.facebook.action + '&amp;colorscheme=light&amp;font&amp;height=21" scrolling="no" frameborder="0" style="border:none; overflow:hidden; width:145px; height:21px;" allowTransparency="true"></iframe>';
				// Commented out
				// Planned
//				var fb_code = '<div class="fb-like" data-href="' + fb_enc_uri + '" data-send="false" data-layout="button_count" data-width="145" data-show-faces="false" data-action="' + options.services.facebook.action + '"></div><script>(function(d, s, id) {var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) return;js = d.createElement(s); js.id = id;js.src = "//connect.facebook.net/' + options.services.facebook.language + '/all.js";fjs.parentNode.insertBefore(js, fjs);}(document, \'script\', \'facebook-jssdk\'));</script>';
				var fb_dummy_btn = '<span class="fb_' + options.services.facebook.action + '_dummy twoclick-network">&nbsp;</span>';

				context.append('<li class="twoclick-facebook"><div class="twoclick-button-container help_info"><span class="info">' + options.services.facebook.txt_info + '</span><span class="switch off">' + options.services.facebook.txt_fb_off + '</span><div class="fb_' + options.services.facebook.action + '_btn dummy_btn">' + fb_dummy_btn + '</div></div></li>');

				var $container_fb = $('li.twoclick-facebook .twoclick-button-container', context);
//				var $container_fb = $('.twoclick-button-container', context);

//				$('li.twoclick-facebook div.fb_' + options.services.facebook.action + ' span.fb_' + options.services.facebook.action + '_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-facebook span.switch', context).live('click', function () {
				$(document).on('click', '.social_share_privacy_area_' + options.post_id + ' span.fb_' + options.services.facebook.action + '_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-facebook span.switch', function () {
					if ($container_fb.find('span.switch').hasClass('off')) {
						$container_fb.addClass('info_off');
						$container_fb.find('span.switch').addClass('on').removeClass('off').html(options.services.facebook.txt_fb_on);
						$container_fb.find('span.fb_' + options.services.facebook.action + '_dummy').replaceWith(fb_code);
					} else {
						$container_fb.removeClass('info_off');
						$container_fb.find('span.switch').addClass('off').removeClass('on').html(options.services.facebook.txt_fb_off);
						$container_fb.find('.fb_' + options.services.facebook.action + '_btn').html(fb_dummy_btn);
					}
				});
			}

			//
			// Twitter
			//
			if(twitter_on) {
				var text = options.services.twitter.tweet_text;
				if(typeof text === 'function') {
					text = text();
				}

				// 120 is the max character count left after twitters automatic url shortening with t.co
				text = abbreviateText(text, '120');

				var reply = '';
				if(options.services.twitter.reply_to != '') {
					reply = '&amp;via=' + options.services.twitter.reply_to;
				}

				var twitter_ref_track = '';
				if(options.services.twitter.referrer_track != '') {
					twitter_ref_track = options.concat + encodeURIComponent(options.services.twitter.referrer_track + options.post_title_referrer_track);
				}

				var twitter_enc_uri = encodeURIComponent(uri) + twitter_ref_track;
				var twitter_count_url = encodeURIComponent(uri);
				var twitter_code = '<iframe allowtransparency="true" frameborder="0" scrolling="no" src="https://platform.twitter.com/widgets/tweet_button.html?url=' + twitter_enc_uri + '&amp;counturl=' + twitter_count_url + '&amp;text=' + text + reply + '&amp;count=horizontal&amp;lang=' + options.services.twitter.language + '" style="width:115px; height:25px;"></iframe>';
				var twitter_dummy_btn = '<span class="twitter_dummy twoclick-network">&nbsp;</span>';

				context.append('<li class="twoclick-twitter"><div class="twoclick-button-container help_info"><span class="info">' + options.services.twitter.txt_info + '</span><span class="switch off">' + options.services.twitter.txt_twitter_off + '</span><div class="twitter_btn dummy_btn">' + twitter_dummy_btn + '</div></div></li>');

				var $container_tw = $('li.twoclick-twitter .twoclick-button-container', context);

//				$('li.twoclick-twitter div.tweet span.twitter_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-twitter span.switch', context).live('click', function () {
				$(document).on('click', '.social_share_privacy_area_' + options.post_id + ' li.twoclick-twitter span.twitter_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-twitter span.switch', function () {
					if($container_tw.find('span.switch').hasClass('off')) {
						$container_tw.addClass('info_off');
						$container_tw.find('span.switch').addClass('on').removeClass('off').html(options.services.twitter.txt_twitter_on);
						$container_tw.find('span.twitter_dummy').replaceWith(twitter_code);
					} else {
						$container_tw.removeClass('info_off');
						$container_tw.find('span.switch').addClass('off').removeClass('on').html(options.services.twitter.txt_twitter_off);
						$container_tw.find('.twitter_btn').html(twitter_dummy_btn);
					}
				});
			}

			//
			// Google+
			//
			if(gplus_on) {
				var gplus_ref_track = '';
				if(options.services.gplus.referrer_track != '') {
					gplus_ref_track = decodeURIComponent(options.concat) + options.services.gplus.referrer_track + options.post_title_referrer_track;
				}

				// fuer G+ wird die URL nicht encoded, da das zu einem Fehler fuehrt
				var gplus_uri = uri + gplus_ref_track;

				// we use the Google+ "asynchronous" code, standard code is flaky if inserted into dom after load
				var gplus_code = '<div class="g-plusone" data-size="medium" data-href="' + gplus_uri + '"></div><script type="text/javascript">window.___gcfg = {lang: "' + options.services.gplus.language + '"}; (function() { var po = document.createElement("script"); po.type = "text/javascript"; po.async = true; po.src = "https://apis.google.com/js/plusone.js"; var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(po, s); })(); </script>';
				var gplus_dummy_btn = '<span class="gplus_one_dummy twoclick-network">&nbsp;</span>';

				context.append('<li class="twoclick-gplus"><div class="twoclick-button-container help_info"><span class="info">' + options.services.gplus.txt_info + '</span><span class="switch off">' + options.services.gplus.txt_gplus_off + '</span><div class="gplusone_btn dummy_btn">' + gplus_dummy_btn + '</div></div></li>');

				var $container_gplus = $('li.twoclick-gplus .twoclick-button-container', context);

//				$('li.twoclick-gplus div.gplusone span.gplus_one_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-gplus span.switch', context).live('click', function () {
				$(document).on('click', '.social_share_privacy_area_' + options.post_id + ' li.twoclick-gplus span.gplus_one_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-gplus span.switch', function () {
					if($container_gplus.find('span.switch').hasClass('off')) {
						$container_gplus.addClass('info_off');
						$container_gplus.find('span.switch').addClass('on').removeClass('off').html(options.services.gplus.txt_gplus_on);
						$container_gplus.find('span.gplus_one_dummy').replaceWith(gplus_code);
					} else {
						$container_gplus.removeClass('info_off');
						$container_gplus.find('span.switch').addClass('off').removeClass('on').html(options.services.gplus.txt_gplus_off);
						$container_gplus.find('.gplusone_btn').html(gplus_dummy_btn);
					}
				});
			}

			//
			// Flattr
			//
			if(flattr_on) {
				var flattr_ref_track = '';
				if(options.services.flattr.referrer_track != '') {
					flattr_ref_track = options.concat + encodeURIComponent(options.services.flattr.referrer_track + options.post_title_referrer_track);
				}

				var flattr_title = options.services.flattr.the_title;
	            		var flattr_uri = (options.services.flattr.uri=="" || options.services.flattr.uri == undefined)?encodeURIComponent(uri):encodeURIComponent(options.services.flattr.uri);
				var flattr_excerpt = options.services.flattr.the_excerpt;
				var flattr_code = '<iframe src="https://api.flattr.com/button/view/?uid=' + options.services.flattr.uid + '&amp;url=' + flattr_uri + '&amp;title=' + flattr_title + '&amp;description=' + flattr_excerpt + '&amp;category=text&amp;language=de_DE&amp;button=compact" style="width:110px; height:22px;" allowtransparency="true" frameborder="0" scrolling="no"></iframe>';
				var flattr_dummy_btn = '<span class="flattr_dummy twoclick-network">&nbsp;</span>';

				context.append('<li class="twoclick-flattr"><div class="twoclick-button-container help_info"><span class="info">' + options.services.flattr.txt_info + '</span><span class="switch off">' + options.services.flattr.txt_flattr_off + '</span><div class="flattr_btn dummy_btn">' + flattr_dummy_btn + '</div></div></li>');

				var $container_flattr = $('li.twoclick-flattr .twoclick-button-container', context);

//				$('li.twoclick-flattr div.flattrbtn span.flattr_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-flattr span.switch', context).live('click', function () {
				$(document).on('click', '.social_share_privacy_area_' + options.post_id + ' li.twoclick-flattr span.flattr_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-flattr span.switch', function () {
					if($container_flattr.find('span.switch').hasClass('off')) {
						$container_flattr.addClass('info_off');
						$container_flattr.find('span.switch').addClass('on').removeClass('off').html(options.services.flattr.txt_flattr_on);
						$container_flattr.find('span.flattr_dummy').replaceWith(flattr_code);
					} else {
						$container_flattr.removeClass('info_off');
						$container_flattr.find('span.switch').addClass('off').removeClass('on').html(options.services.flattr.txt_flattr_off);
						$container_flattr.find('.flattr_btn').html(flattr_dummy_btn);
					}
				});
			}

			//
			// Xing
			//
			if(xing_on) {
				var xing_ref_track = '';
				if(options.services.xing.referrer_track != '') {
					xing_ref_track = decodeURIComponent(options.concat) + options.services.xing.referrer_track + decodeURIComponent(options.post_title_referrer_track);
				}

				var xing_lingua = options.services.xing.language;
				var xing_uri = uri + xing_ref_track;

				var xing_code = '<script type="XING/Share" data-counter="right" data-lang="' + xing_lingua + '" data-url="' + xing_uri + '"></script><script>;(function(d, s) {var x = d.createElement(s),s = d.getElementsByTagName(s)[0];x.src =\'https://www.xing-share.com/js/external/share.js\';s.parentNode.insertBefore(x, s);})(document, \'script\');</script>';
				var xing_dummy_btn = '<span class="xing_dummy twoclick-network">&nbsp;</span>';

				context.append('<li class="twoclick-xing"><div class="twoclick-button-container help_info"><span class="info">' + options.services.xing.txt_info + '</span><span class="switch off">' + options.services.xing.txt_xing_off + '</span><div class="xing_btn dummy_btn">' + xing_dummy_btn + '</div></div></li>');

				var $container_xing = $('li.twoclick-xing .twoclick-button-container', context);

//				$('li.twoclick-xing div.xingbtn span.xing_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-xing span.switch', context).live('click', function () {
				$(document).on('click', '.social_share_privacy_area_' + options.post_id + ' li.twoclick-xing div.xing_btn span.xing_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-xing span.switch', function () {
					if($container_xing.find('span.switch').hasClass('off')) {
						$container_xing.addClass('info_off');
						$container_xing.find('span.switch').addClass('on').removeClass('off').html(options.services.xing.txt_xing_on);
						$container_xing.find('span.xing_dummy').replaceWith(xing_code);
					} else {
						$container_xing.removeClass('info_off');
						$container_xing.find('span.switch').addClass('off').removeClass('on').html(options.services.xing.txt_xing_off);
						$container_xing.find('.xing_btn').html(xing_dummy_btn);
					}
				});
			}

			//
			// Pinterest
			//
			if(pinterest_on) {
				var pinterest_uri = uri;
				var pinterest_excerpt = encodeURIComponent(options.services.pinterest.the_excerpt);
				var pinterest_media = options.services.pinterest.media;

				var pinterest_code = '<a href="https://pinterest.com/pin/create/button/?url=' + pinterest_uri + '&media=' + pinterest_media + '&description=' + pinterest_excerpt + '" class="pin-it-button" count-layout="horizontal"><img border="0" src="//assets.pinterest.com/images/PinExt.png" title="Pin It" /></a><script type="text/javascript" src="//assets.pinterest.com/js/pinit.js"></script>';
				var pinterest_dummy_btn = '<span class="pinterest_dummy twoclick-network">&nbsp;</span>';

				context.append('<li class="twoclick-pinterest"><div class="twoclick-button-container help_info"><span class="info">' + options.services.pinterest.txt_info + '</span><span class="switch off">' + options.services.pinterest.txt_pinterest_off + '</span><div class="pinterest_btn dummy_btn">' + pinterest_dummy_btn + '</div></div></li>');

				var $container_pinterest = $('li.twoclick-pinterest .twoclick-button-container', context);

//				$('li.twoclick-pinterest div.pinterestbtn span.pinterest_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-pinterest span.switch', context).live('click', function () {
				$(document).on('click', '.social_share_privacy_area_' + options.post_id + ' li.twoclick-pinterest span.pinterest_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-pinterest span.switch', function () {
					if($container_pinterest.find('span.switch').hasClass('off')) {
						$container_pinterest.addClass('info_off');
						$container_pinterest.find('span.switch').addClass('on').removeClass('off').html(options.services.pinterest.txt_pinterest_on);
						$container_pinterest.find('span.pinterest_dummy').replaceWith(pinterest_code);
					} else {
						$container_pinterest.removeClass('info_off');
						$container_pinterest.find('span.switch').addClass('off').removeClass('on').html(options.services.pinterest.txt_pinterest_off);
						$container_pinterest.find('.pinterest_btn').html(pinterest_dummy_btn);
					}
				});
			}

			//
			// t3n
			//
			if(t3n_on) {
				var t3n_uri = uri;

				var t3n_code = '<div class="t3nAggregator" data-url="' + t3n_uri + '"></div><script type="text/javascript">(function() {var po = document.createElement("script"); po.type = "text/javascript"; po.async = true;po.src = "https://t3n.de/aggregator/ebutton_async";var s = document.getElementsByTagName("script")[0]; s.parentNode.insertBefore(po, s);})();</script>';
				var t3n_dummy_btn = '<span class="t3n_dummy twoclick-network">&nbsp;</span>';

				context.append('<li class="twoclick-t3n"><div class="twoclick-button-container help_info"><span class="info">' + options.services.t3n.txt_info + '</span><span class="switch off">' + options.services.t3n.txt_t3n_off + '</span><div class="t3n_btn dummy_btn">' + t3n_dummy_btn + '</div></div></li>');

				var $container_t3n = $('li.twoclick-t3n .twoclick-button-container', context);

//				$('li.twoclick-t3n div.t3nbtn span.t3n_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-t3n span.switch', context).live('click', function () {
				$(document).on('click', '.social_share_privacy_area_' + options.post_id + ' li.twoclick-t3n span.t3n_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-t3n span.switch', function () {
					if($container_t3n.find('span.switch').hasClass('off')) {
						$container_t3n.addClass('info_off');
						$container_t3n.find('span.switch').addClass('on').removeClass('off').html(options.services.t3n.txt_t3n_on);
						$container_t3n.find('span.t3n_dummy').replaceWith(t3n_code);
					} else {
						$container_t3n.removeClass('info_off');
						$container_t3n.find('span.switch').addClass('off').removeClass('on').html(options.services.t3n.txt_t3n_off);
						$container_t3n.find('.t3n_btn').html(t3n_dummy_btn);
					}
				});
			}

			//
			// linkedin
			//
			if(linkedin_on) {
				var linkedin_uri = uri;

				var linkedin_code = '<script src="https://platform.linkedin.com/in.js" type="text/javascript"></script><script type="IN/Share" data-url="' + linkedin_uri + '" data-counter="right"></script>';
				var linkedin_dummy_btn = '<span class="linkedin_dummy twoclick-network">&nbsp;</span>';

				context.append('<li class="twoclick-linkedin"><div class="twoclick-button-container help_info"><span class="info">' + options.services.linkedin.txt_info + '</span><span class="switch off">' + options.services.linkedin.txt_linkedin_off + '</span><div class="linkedin_btn dummy_btn">' + linkedin_dummy_btn + '</div></div></li>');

				var $container_linkedin = $('li.twoclick-linkedin .twoclick-button-container', context);

//				$('li.twoclick-linkedin div.linkedinbtn span.linkedin_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-linkedin span.switch', context).live('click', function () {
				$(document).on('click', '.social_share_privacy_area_' + options.post_id + ' li.twoclick-linkedin span.linkedin_dummy, .social_share_privacy_area_' + options.post_id + ' li.twoclick-linkedin span.switch', function () {
					if($container_linkedin.find('span.switch').hasClass('off')) {
						$container_linkedin.addClass('info_off');
						$container_linkedin.find('span.switch').addClass('on').removeClass('off').html(options.services.linkedin.txt_linkedin_on);
						$container_linkedin.find('span.linkedin_dummy').replaceWith(linkedin_code);
					} else {
						$container_linkedin.removeClass('info_off');
						$container_linkedin.find('span.switch').addClass('off').removeClass('on').html(options.services.linkedin.txt_linkedin_off);
						$container_linkedin.find('.linkedin_btn').html(linkedin_dummy_btn);
					}
				});
			}

			//
			// Der Info/Settings-Bereich wird eingebunden
			//
			var settings_class = '';
			if(options.display_infobox == 'on') {
				settings_class = 'settings_info_menu';
				context.append('<li class="settings_info"><div class="' + settings_class + ' off perma_option_off"><a href="' + options.info_link + '"><span class="help_info icon"><span class="info">' + options.txt_help + '</span></span></a></div></li>');
			} else {
				settings_class = 'settings_menu';
				context.append('<li class="settings_info"><div class="' + settings_class + ' off perma_option_off"></div></li>');
			}
//			context.append('<li class="settings_info"><div class="settings_info_menu off perma_option_off"><a href="' + options.info_link + '"><span class="help_info icon"><span class="info">' + options.txt_help + '</span></span></a></div></li>');
//			context.append(settings_html);

			// Info-Overlays mit leichter Verzoegerung einblenden
//			$('.help_info:not(.info_off)', context).live('mouseenter', function () {
			$(document).on('mouseenter', '.help_info:not(.info_off)', function () {
				var $info_wrapper = $(this);
//				var timeout_id = window.setTimeout(function () { $($info_wrapper).addClass('display'); }, 0);
				$($info_wrapper).addClass('display');
//				$(this).data('timeout_id', timeout_id);
			});
//			$('.help_info', context).live('mouseleave', function () {
			$(document).on('mouseleave', '.help_info', function () {
//				var timeout_id = $(this).data('timeout_id');
//				window.clearTimeout(timeout_id);

				if($(this).hasClass('display')) {
					$(this).removeClass('display');
				}
			});

			var facebook_perma		= (options.services.facebook.perma_option	=== 'on');
			var twitter_perma		= (options.services.twitter.perma_option	=== 'on');
			var gplus_perma			= (options.services.gplus.perma_option		=== 'on');
			var flattr_perma		= (options.services.flattr.perma_option		=== 'on');
			var xing_perma			= (options.services.xing.perma_option		=== 'on');
			var pinterest_perma		= (options.services.pinterest.perma_option	=== 'on');
			var t3n_perma			= (options.services.t3n.perma_option		=== 'on');
			var linkedin_perma		= (options.services.linkedin.perma_option	=== 'on');

			// Menue zum dauerhaften Einblenden der aktiven Dienste via Cookie einbinden
			// Die IE7 wird hier ausgenommen, da er kein JSON kann und die Cookies hier ueber JSON-Struktur abgebildet werden
			if(((facebook_on && facebook_perma)
				|| (twitter_on && twitter_perma)
				|| (gplus_on && gplus_perma)
				|| (flattr_on && flattr_perma)
				|| (xing_on && xing_perma)
				|| (pinterest_on && pinterest_perma)
				|| (t3n_on && t3n_perma)
				|| (linkedin_on && linkedin_perma))
				&& (!$.browser.msie || ($.browser.msie && ($.browser.version > 7.0)))) {

				// Cookies abrufen
				var cookie_list = document.cookie.split(';');
				var cookies = '{';
				var i = 0;

				for(; i < cookie_list.length; i += 1) {
					var foo = cookie_list[i].split('=');
					cookies += '"' + $.trim(foo[0]) + '":"' + $.trim(foo[1]) + '"';

					if(i < cookie_list.length - 1) {
						cookies += ',';
					}
				}

				cookies += '}';
				cookies = JSON.parse(cookies);

				// Container definieren
				var $container_settings_info = $('li.settings_info', context);

				// Klasse entfernen, die das i-Icon alleine formatiert, da Perma-Optionen eingeblendet werden
//				$container_settings_info.find('.settings_info_menu').removeClass('perma_option_off');
				$container_settings_info.find('.' + settings_class).removeClass('perma_option_off');

				// Perma-Optionen-Icon (.settings) und Formular (noch versteckt) einbinden
//				$container_settings_info.find('.settings_info_menu').append('<span class="settings">Einstellungen</span><form><fieldset><legend>' + options.settings_perma + '</legend></fieldset></form>');
				$container_settings_info.find('.' + settings_class).append('<span class="settings">Einstellungen</span><form><fieldset><legend>' + options.settings_perma + '</legend></fieldset></form>');

				// Die Dienste mit <input> und <label>, sowie checked-Status laut Cookie, schreiben
				var checked = ' checked="checked"';

				// Facebook
				if(facebook_on && facebook_perma) {
					var perma_status_facebook = cookies.socialSharePrivacy_facebook === 'perma_on' ? checked : '';
					$container_settings_info.find('form fieldset').append(
						'<input type="checkbox" name="perma_status_facebook" id="perma_status_facebook"'
						+ perma_status_facebook + ' /><label for="perma_status_facebook">'
						+ options.services.facebook.display_name + '</label>'
					);
				}

				// Twitter
				if(twitter_on && twitter_perma) {
					var perma_status_twitter = cookies.socialSharePrivacy_twitter === 'perma_on' ? checked : '';
					$container_settings_info.find('form fieldset').append(
						'<input type="checkbox" name="perma_status_twitter" id="perma_status_twitter"'
						+ perma_status_twitter + ' /><label for="perma_status_twitter">'
						+ options.services.twitter.display_name + '</label>'
					);
				}

				// Google+
				if(gplus_on && gplus_perma) {
					var perma_status_gplus = cookies.socialSharePrivacy_gplus === 'perma_on' ? checked : '';
					$container_settings_info.find('form fieldset').append(
						'<input type="checkbox" name="perma_status_gplus" id="perma_status_gplus"'
						+ perma_status_gplus + ' /><label for="perma_status_gplus">'
						+ options.services.gplus.display_name + '</label>'
					);
				}

				// Flattr
				if(flattr_on && flattr_perma) {
					var perma_status_flattr = cookies.socialSharePrivacy_flattr === 'perma_on' ? checked : '';
					$container_settings_info.find('form fieldset').append(
						'<input type="checkbox" name="perma_status_flattr" id="perma_status_flattr"'
						+ perma_status_flattr + ' /><label for="perma_status_flattr">'
						+ options.services.flattr.display_name + '</label>'
					);
				}

				// Xing
				if(xing_on && xing_perma) {
					var perma_status_xing = cookies.socialSharePrivacy_xing === 'perma_on' ? checked : '';
					$container_settings_info.find('form fieldset').append(
						'<input type="checkbox" name="perma_status_xing" id="perma_status_xing"'
						+ perma_status_xing + ' /><label for="perma_status_xing">'
						+ options.services.xing.display_name + '</label>'
					);
				}

				// Pinteres
				if(pinterest_on && pinterest_perma) {
					var perma_status_pinterest = cookies.socialSharePrivacy_pinterest === 'perma_on' ? checked : '';
					$container_settings_info.find('form fieldset').append(
						'<input type="checkbox" name="perma_status_pinterest" id="perma_status_pinterest"'
						+ perma_status_pinterest + ' /><label for="perma_status_pinterest">'
						+ options.services.pinterest.display_name + '</label>'
					);
				}

				// t3n
				if(t3n_on && t3n_perma) {
					var perma_status_t3n = cookies.socialSharePrivacy_t3n === 'perma_on' ? checked : '';
					$container_settings_info.find('form fieldset').append(
						'<input type="checkbox" name="perma_status_t3n" id="perma_status_t3n"'
						+ perma_status_t3n + ' /><label for="perma_status_t3n">'
						+ options.services.t3n.display_name + '</label>'
					);
				}

				// LinkedIn
				if(linkedin_on && linkedin_perma) {
					var perma_status_linkedin = cookies.socialSharePrivacy_linkedin === 'perma_on' ? checked : '';
					$container_settings_info.find('form fieldset').append(
						'<input type="checkbox" name="perma_status_linkedin" id="perma_status_linkedin"'
						+ perma_status_linkedin + ' /><label for="perma_status_linkedin">'
						+ options.services.linkedin.display_name + '</label>'
					);
				}

				// Cursor auf Pointer setzen fuer das Zahnrad
				$container_settings_info.find('span.settings').css('cursor', 'pointer');

				// Einstellungs-Menue bei mouseover ein-/ausblenden
//				$($container_settings_info.find('span.settings'), context).live('mouseenter', function () {
				$(document).on('mouseenter', 'span.settings', function () {
//					var timeout_id = window.setTimeout(function () { $container_settings_info.find('.settings_info_menu').removeClass('off').addClass('on'); }, 500);
					var timeout_id = window.setTimeout(function () { $container_settings_info.find('.' + settings_class).removeClass('off').addClass('on'); }, 500);
					$(this).data('timeout_id', timeout_id);
				});
//				$($container_settings_info, context).live('mouseleave', function () {
				$(document).on('mouseleave', 'li.settings_info', function () {
					var timeout_id = $(this).data('timeout_id');
					window.clearTimeout(timeout_id);
//					$container_settings_info.find('.settings_info_menu').removeClass('on').addClass('off');
					$container_settings_info.find('.' + settings_class).removeClass('on').addClass('off');
				});

				// Klick-Interaktion auf <input> um Dienste dauerhaft ein- oder auszuschalten (Cookie wird gesetzt oder geloescht)
//				$($container_settings_info.find('fieldset input')).live('click', function (event) {
				$(document).on('click', 'form fieldset input', function (event) {
					var click = event.target.id;
					var service = click.substr(click.lastIndexOf('_') + 1, click.length);
					var cookie_name = 'socialSharePrivacy_' + service;

					if($('#' + event.target.id + ':checked').length) {
						cookieSet(cookie_name, 'perma_on', options.cookie_expires, options.cookie_path, options.cookie_domain);
						$('form fieldset label[for=' + click + ']', context).addClass('checked');
					} else {
						cookieDel(cookie_name, 'perma_on', options.cookie_path, options.cookie_domain);
						$('form fieldset label[for=' + click + ']', context).removeClass('checked');
					}
				});

				// Dienste automatisch einbinden, wenn entsprechendes Cookie vorhanden ist
				// Facebook
				if(facebook_on && facebook_perma && cookies.socialSharePrivacy_facebook === 'perma_on') {
					$('li.twoclick-facebook div.fb_' + options.services.facebook.action + '_btn span.fb_' + options.services.facebook.action + '_dummy', context).click();
				}

				// Twitter
				if(twitter_on && twitter_perma && cookies.socialSharePrivacy_twitter === 'perma_on') {
					$('li.twoclick-twitter div.twitter_btn span.twitter_dummy', context).click();
				}

				// Googleplus
				if(gplus_on && gplus_perma && cookies.socialSharePrivacy_gplus === 'perma_on') {
					$('li.twoclick-gplus div.gplusone_btn span.gplus_one_dummy', context).click();
				}

				// Flattr
				if(flattr_on && flattr_perma && cookies.socialSharePrivacy_flattr === 'perma_on') {
					$('li.twoclick-flattr div.flattr_btn span.flattr_dummy', context).click();
				}

				// Xing
				if(xing_on && xing_perma && cookies.socialSharePrivacy_xing === 'perma_on') {
					$('li.twoclick-xing div.xing_btn span.xing_dummy', context).click();
				}

				// Pinterest
				if(pinterest_on && pinterest_perma && cookies.socialSharePrivacy_pinterest === 'perma_on') {
					$('li.twoclick-pinterest div.pinterest_btn span.pinterest_dummy', context).click();
				}

				// t3n
				if(t3n_on && t3n_perma && cookies.socialSharePrivacy_t3n === 'perma_on') {
					$('li.twoclick-t3n div.t3n_btn span.t3n_dummy', context).click();
				}

				// LinkedIn
				if(linkedin_on && linkedin_perma && cookies.socialSharePrivacy_linkedin === 'perma_on') {
					$('li.twoclick-linkedin div.linkedin_btn span.linkedin_dummy', context).click();
				}
			}
		});
	};
})(jQuery);
