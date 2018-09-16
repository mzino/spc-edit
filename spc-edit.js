// Requirements
const request = require('request')
const cheerio = require('cheerio')
const async = require('async')

// Set cookie
const j = request.jar()
const cookie = request.cookie('') // Paste cookie in this string
const uri = 'https://www.gamesforum.it'
j.setCookie(cookie, uri)

// SCRIPT START
console.log('Gathering links...')
request({
	uri: uri+'/topic/1302-regolamento-di-sezione-lista-topic-ufficiali/',
	method: 'GET',
	headers: {
		'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.16 Safari/537.36',
		'Cookie': cookie,
		'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
		'Connection': 'keep-alive'
	},
	jar: j
}, (err,httpResponse,body) => {
	if (err) {
		return console.log(err)
	}
	var $ = cheerio.load(body,{decodeEntities: false})
	var topicsRaw = $('.ipsType_normal.ipsType_richText.ipsContained').find('a')
	console.log('Links gathered.')

	// Cycle through topics list (starting from the first game, stay attenzionati)
	var range = topicsRaw.slice(20, topicsRaw.length);
	async.eachSeries(range, (topic, nextTopic) => {
		var topicHtml = $.html(topic)
		var topicUrl = $(topicHtml).attr('href')
		var topicPath = topicUrl.substr(topicUrl.indexOf('gamesforum.it')+13,300)

		// Skip non-game topics, stay attenzionati here too
		if ((topicPath.substr(7,5)==='1302-')
			|| (topicPath.substr(7,5)=='5686-')
			|| (topicPath.substr(7,5)=='3788-')
			|| (topicPath.substr(7,5)=='12807')
			|| (topicPath.substr(7,5)=='5122-')
			|| (topicPath.substr(7,5)=='5704-')) {
			console.log('Skipped topic '+topicPath)
			nextTopic()
		} else {

			// Get the edit topic page
			request({
				uri: uri+topicPath+'/?do=edit',
				method: 'GET',
				headers: {
					'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.16 Safari/537.36',
					'Cookie': cookie,
					'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
					'Connection': 'keep-alive'
				}
			}, (err,httpResponse,singleTopic) => {
				if (err) {
					return console.log(err)
				}
				var $ = cheerio.load(singleTopic,{decodeEntities: false})

				// Get the csrf token
				var keyRaw = $('.ipsMenu_itemChecked').find('form')
				var keyHtml = $.html(keyRaw)
				var keyLink = $(keyHtml).attr('action')
				var key = keyLink.substr(keyLink.indexOf('Key=')+4,32)

				// Get the title and post content
				var titleRaw = $('#elInput_topic_title')
				var titleHtml = $.html(titleRaw)
				var title = $(titleHtml).attr('value')
				var contentRaw = $('textarea[class=ipsHide]')
				var content = $.text(contentRaw)

				var formData = {
					'form_submitted': '1',
					'csrfKey': key,
					'MAX_FILE_SIZE': '535822336',
					// 'plupload': '',
					'topic_title': title,
					'topic_prefix': 'ufficiale pc',
					'topic_tags_original': '',
					'topic_tags': '',
					'topic_tags_prefix': '',
					'topic_content': content,
					'comment_edit_reason': '',
					'comment_log_edit': '0',
					// 'topic_create_state[__EMPTY]': '__EMPTY',
					// 'topic_open_time': '',
					// 'topic_open_time_time': '',
					// 'topic_close_time': '',
					// 'topic_close_time_time': '',
					// 'topic_poll[title]': '',
					// 'topic_poll[poll_close_date]': '',
					// 'topic_poll[poll_close_time]': ''
				}
				console.log('GET '+topicPath)

				// Edit the topic
				request({
					uri: uri+topicPath+'/?do=edit',
					method: 'POST',
					headers: {
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.16 Safari/537.36',
						'Cookie': cookie,
						'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
						'Connection': 'keep-alive'
					},
					formData: formData
				}, (err,httpResponse,edit) => {
					if (err) {
						return console.log(err)
					} else {
						console.log('Edited '+topicPath)
						nextTopic()
					}
				})
			})
		}
	}, (err) => {
		if (err) {
			return console.log(err)
		} else {
			return console.log('Done!')
		}
	})
})
