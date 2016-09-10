$(function(){
	$('#search_button').button({
		icons :{
			primary : 'ui-icon-search'
		}
	});

	//提问按钮
	$('#question_button').button({
		icons :{
			primary : 'ui-icon-lightbulb'
		}
	}).click(function(){
		if ($.cookie('user')){
			$('#question').dialog('open');
		}else {
			$('#error').dialog('open');
			setTimeout(function(){
				$('#error').dialog('close');
				$('#login').dialog('open');
			},1000);
		}
		
	});

	$.ajax({
		url : 'show_content.php',
		type : 'POST',
		success : function(response, status, xhr){
			var json = $.parseJSON(response);
			var html = '';
			var arr = [];
			var summery = [];
			$.each(json, function(index, value){
				html += '<h4>'+value.user+' 发布于 '+value.date+'</h4><h3>'+value.title+'</h3><div class="editor">'+value.content+'</div><div class="bottom"><span class="comment" date_id="'+value.id+'">'+value.count+'条评论</span><span class="up">收起</span></div><hr noshade="noshade" size="1" /><div class="comment_list"></div>';
			});
			$('.content').append(html);

			//只显示前两百位
			$.each($('.editor'), function(index, value){
				arr[index] = $(value).html();
				summery[index] = arr[index].substring(0,200);
				//最后一位==‘<’
				if (summery[index].substring(199,200) == '<') {
					summery[index] = replacePos(summery[index], 200, '');
				}
				//最后两位==‘</’
				if (summery[index].substring(198,200) == '</') {
					summery[index] = replacePos(summery[index], 200, '');
					summery[index] = replacePos(summery[index], 199, '');
				}

				if (arr[index].length > 200) {
					summery[index] +='....<span class="down">显示全部</span>';
					$(value).html(summery[index]);
				}

				$('.bottom .up').hide();
			});

			$.each($('.editor'), function(index, value){
				$(this).on('click', '.down', function(){
					$('.editor').eq(index).html(arr[index]);
					$(this).hide();
					$('.bottom .up').eq(index).show();
				});
			});
			$.each($('.bottom'), function(index, value){
				$(this).on('click', '.up', function(){
					$('.editor').eq(index).html(summery[index]);
					$(this).hide();
					$('.editor .down').eq(index).show();
				});
			});

			//评论按钮
			$.each($('.bottom'), function(index, value){
				$(this).on('click', '.comment', function(){
					var comment_this=this;
					if ($.cookie('user')){
						if (!$('.comment_list').eq(index).has('form').length) {	
							$.ajax({
								url : 'show_comment.php',
								type : 'POST',
								data : {
									titleid : $(comment_this).attr('date_id'),
								},
								beforeSend : function(jqXHR, settings){
									$('.comment_list').eq(index).append('<dl class="comment_load"><dd>正在加载中</dd></dl>');
								},
								success : function(response, status){
									$('.comment_list').eq(index).find('.comment_load').hide();
									var comment_json = $.parseJSON(response);
									var count = 0;
									$.each(comment_json, function(index2, value){
										count = value.count;
										$('.comment_list').eq(index).append('<dl class="comment_content"><dt>'+value.user+'</dt><dd>'+value.comment+'</dd><dd class="date">'+value.date+'</dd></dl>');
									});
									$('.comment_list').eq(index).append('<dl><dd><span class="load_more">加载更多</span></dd></dl>');
									var page = 2;
									if (page > count) {
										$('.load_more').off('click');
										$('.load_more').hide();
									}
									$('.comment_list').eq(index).find('.load_more').button().on('click', function(){
										
										$.ajax({
											url : 'show_comment.php',
											type : 'POST',
											data : {
												titleid : $(comment_this).attr('date_id'),
												page : page,
											},
											beforeSend : function (jqXHR, settings) {
												$('.load_more').html('<img src="image/more_load.gif" />');
												$('.load_more').button('disable');
											},
											success : function(response, status){
												var json_comment_more = $.parseJSON(response);
												$.each(json_comment_more, function(index3, value){
													$('.comment_list').eq(index).find('.comment_content').last().after('<dl class="comment_content"><dt>'+value.user+'</dt><dd>'+value.comment+'</dd><dd class="date">'+value.date+'</dd></dl>');
												});
												$('.load_more').html('加载更多');
												$('.load_more').button('enable');
												page++;
												if (page > count) {
													$('.load_more').off('click');
													$('.load_more').hide();
												}
											},
										});
									});
									$('.comment_list').eq(index).append('<form><dl class="comment_add"><dt><textarea name="comment"></textarea><dt/><dd><input type="hidden" name="titleid" value="'+$(comment_this).attr('date_id')+'" /><input type="hidden" name="user" value="'+$.cookie('user')+'" /><input type="button" name="comment" value="发表" /></dd></dl></form>');
									$('.comment_list').eq(index).find('input[type=button]').button().click(function(){
										var _this=this;
										$('.comment_list').eq(index).find('form').ajaxSubmit({
											url : 'add_comment.php',
											type : 'POST',
											beforeSubmit : function(formDate, jqForm, options){
												$('#loading').dialog('open');
												$(_this).button('disable');
											},
											success : function(responseText, statusTest){
												if(responseText){
													$(_this).button('enable');
													$('#loading').css('background', 'url(image/success.gif) no-repeat 20px center').html('发布成功！');
													//执行1秒后的操作
													setTimeout(function(){
														var date = new Date();
														$('#loading').dialog('close');
														$('.comment_list').eq(index).prepend('<dl class="comment_content"><dt>'+$.cookie('user')+'</dt><dd>'+$('textarea').val()+'</dd><dd>'+date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds()+'</dd></dl>');
														$('#loading').css('background', 'url(image/loading.gif) no-repeat 20px center').html('数据提交互中。。');
														$('.comment_list').eq(index).find('form').resetForm();
													},1000);
												}
											},
										});
									});
								},
							});
						}
						if ($('.comment_list').eq(index).is(':hidden')) {
							$('.comment_list').eq(index).show();
						}else {
							$('.comment_list').eq(index).hide();
						}
						
					}else {
						$('#error').dialog('open');
						setTimeout(function(){
							$('#error').dialog('close');
							$('#login').dialog('open');
						},1000);
					}	
				});
			});

			/*
			 第一种方法：设置内容高度为155
			$.each($('.editor'), function(index, value){
		 		arr[index] = $(value).height();
			 	if ($(value).height() > 155) {
					$(value).next().find('.up').hide();
				}
				$(value).height(155);
			});

			$.each($('.bottom .down'), function(index,value){
				$(this).click(function(){
					$(this).parent().prev().height(arr[index]);
					$(this).hide();
					$(this).next().show();
				});
			});
			$.each($('.bottom .up'), function(index,value){
				$(this).click(function(){
					$(this).parent().prev().height(155);
					$(this).hide();
					$(this).prev().show();
				});
			});*/

		},
	});

	//点击提问按钮无登录状态的提示登录
	$('#error').dialog({
		autoOpen : false,
		modal : true,
		draggable : false,
		resizable : false,
		width : 180,
		height : 50,
	}).parent().find('.ui-widget-header').hide();

	//问题描述框
	$('#question').dialog({
		autoOpen :false,
		resizable : false,
		modal : true,
		width : 510,
		height : 360,
		buttons :{
			'发布' : function(){
				$(this).ajaxSubmit({
					url : 'add_content.php',
					type : 'POST',
					data :{
						user : $.cookie('user'),
						content : $('.uEditorIframe').contents().find('#iframeBody').html(),
					},

					beforeSubmit : function(formDate, jqForm, options){
						$('#loading').dialog('open');
						$('#question').dialog('widget').find('button').eq(1).button('disable');
					},
					success : function(responseText, statusTest){
						if(responseText){
							$('#question').dialog('widget').find('button').eq(1).button('enable');
							$('#loading').css('background', 'url(image/success.gif) no-repeat 20px center').html('发布成功！');
							//执行1秒后的操作
							setTimeout(function(){
								$('#loading').dialog('close');
								$('#question').dialog('close');
								$('#loading').css('background', 'url(image/loading.gif) no-repeat 20px center').html('数据提交互中。。');
								$('#question').resetForm();
								$('.uEditorIframe').contents().find('#iframeBody').html('请填写问题描述！ ');
							},1000);
						}
					},

				});
			},
			
		},
	});
  	//引入编辑插件
  	$('.uEditorCustom').uEditor();

	//隐藏用户和登录
	$('#member, #logout').hide();
	//判断cookie存不存在
	if ($.cookie('user')) {
		$('#member, #logout').show();
		$('#reg_a, #login_a').hide();
		$('#member').html($.cookie('user'));
	}else {
		$('#member, #logout').hide();
		$('#reg_a #login_a').show();
	}
	 
	//点击退出事件
	$('#logout').click(function(){
		$.removeCookie('user');
		window.location.href='/jQuery_cookie/';
	});

	 //提交提示框
	$('#loading').dialog({
		autoOpen : false,
		modal : true,
		draggable : false,
		resizable : false,
		width : 180,
		height : 50,
	}).parent().find('.ui-widget-header').hide();

	$('#reg_a').click(function(){
		$('#reg').dialog('open');
	});


	//注册框
	$('#reg').dialog({
		autoOpen :false,
		resizable : false,
		modal : true,
		width : 380,
		height : 340,
		buttons :{
			'提交' : function(){
				$(this).submit();
			}
		}
	}).buttonset().validate({

		submitHandler : function(form){
			$(form).ajaxSubmit({
				url : 'add.php',
				type : 'POST',
				beforeSubmit : function(formDate, jqForm, options){
					$('#loading').dialog('open');
					$('#reg').dialog('widget').find('button').eq(1).button('disable');
				},
				success : function(responseText, statusTest){
					if(responseText){
						$('#reg').dialog('widget').find('button').eq(1).button('enable');
						$('#loading').css('background', 'url(image/success.gif) no-repeat 20px center').html('数据提交成功！');
						//载入cookie
						$.cookie('user', $('#user').val());
						//执行1秒后的操作
						setTimeout(function(){
							$('#loading').dialog('close');
							$('#reg').dialog('close');
							$('#loading').css('background', 'url(image/loading.gif) no-repeat 20px center').html('数据提交互中。。');
							$('#reg span.star').html('*').removeClass('succ');
							$('#reg').resetForm();
							$('#member, #logout').show();
							$('#reg_a, #login_a').hide();
							$('#member').html($.cookie('user'));
						},1000);
					}
				},
			});
		},

		showErrors : function(errorMap, errorList){
			var errors = this.numberOfInvalids();
			if (errors > 0) {
				$('#reg').dialog('option', 'height', errors * 20 +340);
			}else {
				$('#reg').dialog('option', 'height', 340);
			}

			this.defaultShowErrors();
		},

		//设置高亮
		highlight : function(element, errorClass){
			$(element).css('border', '1px solid maroon');
			$(element).parent().find('.star').html('*').removeClass('succ');
		},
		//成功的元素移出错误高亮
		unhighlight : function(element, errorClass){
			$(element).css('border', '1px solid #ccc');
			$(element).parent().find('.star').html('&nbsp;').addClass('succ');
		},

		//错误信息统一包裹
		errorLabelContainer : 'ol.reg_error',
		wrapper : 'li',

		rules : {
			user : {
				required : true,
				minlength : 2,
				remote : {
					url : 'is_user.php',
					type : 'POST',
				},
			},
			pass : {
				required : true,
				minlength : 6,
			},
			email : {
				required : true,
				email : true,
			},
			date : {
				date : true,
			},
		},
		messages : {
			user : {
				required : '账号不能为空!',
				minlength : jQuery.format('账号不能少于{0}位！'),
				remote : '账号已经被占用!',
			},
			pass : {
				required : '密码不能为空!',
				minlength : jQuery.format('密码不能少于{0}位！'),
			},
			email : {
				required : '邮件不能为空!',
				minlength : '请输入正确的邮件格式！',
			},
		}
	});

	$('#date').datepicker({
		dateFormat : 'yy-mm-dd',
		dayNamesMin :  ['日','一','二','三','四','五','六'],
		monthNames :  ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
		monthNamesShort :  ['一月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','十二月'],
		changeMonth : true,
		changeYear : true,
		yearRange : '1950:2020',
	});
	// $('#reg input[title]').tooltip({
	// 	position : {
	// 		my : 'left center',
	// 		at : 'right center '
	// 	},
	// 	show : false,
	// 	hide :false
	// });

	$('#email').autocomplete({
		delay : 0,
		autoFocus : true,
		source : function(request,response){
			//创建数据源
			var hosts=['qq.com', '163.com', 'sina.com.cn', 'gmail.com', 'gd.com'];
				term = request.term,             //保存用户输入的内容
				name = term,					 //保存用户名
				host = '',						 //保存域名
				ix = term.indexOf('@');			 //'@'的位置
				result = [];	
				result.push(term);

			if (ix >-1) {
				name = term.slice(0,ix);
				host = term.slice(ix+1);
			}

			if (name) {

				if (host) {
					var findedHosts = $.grep(hosts,function(value,index){
						return value.indexOf(host) > -1;
					});
				}else {
					findedHosts = hosts;
				}

				var findedResult = $.map(findedHosts,function(value, index){
					return name + '@' + value;
				});
				result = result.concat(findedResult);
			}
			response(result);
		},

	});
	// $('#reg_a').click(function(){
	// 	$('#reg').dialog();
	// });
	
	//点击登录事件
	$('#login_a').click(function(){
		$('#login').dialog('open');
	});
	//登录框
	$('#login').dialog({
		autoOpen :false,
		resizable : false,
		modal : true,
		width : 360,
		height : 260,
		buttons :{
			'登录' : function(){
				$(this).submit();
			}
		}
	}).validate({

		submitHandler : function (form){
			$(form).ajaxSubmit({
				url : 'login.php',
				type : 'POST',
				beforeSubmit : function (formDate, jqForm, options){
					$('#loading').dialog('open');
					$('#login').dialog('widget').find('button').eq(1).button('disable');
				},
				success : function(responseText, statusTest){
					if(responseText){
						$('#login').dialog('widget').find('button').eq(1).button('enable');
						$('#loading').css('background', 'url(image/success.gif) no-repeat 20px center').html('登录成功！');
						
						//载入cookie
						if ($('#expires').is(':checked')) {
							$.cookie('user', $('#login_user').val(),{
								expires : 7,
							});
						}else {
							$.cookie('user', $('#login_user').val());
						}
						
						//执行1秒后的操作
						setTimeout(function(){
							$('#loading').dialog('close');
							$('#login').dialog('close');
							$('#loading').css('background', 'url(image/loading.gif) no-repeat 20px center').html('数据提交互中。。');
							$('#login span.star').html('*').removeClass('succ');
							$('#login').resetForm();
							$('#member, #logout').show();
							$('#reg_a, #login_a').hide();
							$('#member').html($.cookie('user'));
						},1000);
					}
				},
			});
		},

		showErrors : function(errorMap, errorList){
			var errors = this.numberOfInvalids();
			if (errors > 0) {
				$('#login').dialog('option', 'height', errors * 20 +260);
			}else {
				$('#login').dialog('option', 'height', 260);
			}

			this.defaultShowErrors();
		},

		//设置高亮
		highlight : function(element, errorClass){
			$(element).css('border', '1px solid maroon');
			$(element).parent().find('.star').html('*').removeClass('succ');
		},
		//成功的元素移出错误高亮
		unhighlight : function(element, errorClass){
			$(element).css('border', '1px solid #ccc');
			$(element).parent().find('.star').html('&nbsp;').addClass('succ');
		},

		//错误信息统一包裹
		errorLabelContainer : 'ol.login_error',
		wrapper : 'li',

		rules : {
			login_user : {
				required : true,
				minlength : 2,
			},
			login_pass : {
				required : true,
				minlength : 6,
				remote : {
					url : 'login.php',
					type : 'POST',
					data : {
						login_user : function(){
							return $('#login_user').val();
						},
					},
				},
			},
		},
		messages : {
			login_user : {
				required : '账号不能为空!',
				minlength : jQuery.format('账号不能少于{0}位！'),
			},
			login_pass : {
				required : '密码不能为空!',
				minlength : jQuery.format('密码不能少于{0}位！'),
				remote : '账号或密码不正确！',
			},
		},
	});


	//选项卡
	$('#tabs').tabs({
		collapsible : true,
	});

	// 折叠菜单
	$('#accordion').accordion({
		collapsible : true,
		active : false,
	});
});

function replacePos(strObj, pos, replaceText){
	return strObj.substring(0,pos-1)+replaceText+strObj.substring(pos,strObj.length);
}