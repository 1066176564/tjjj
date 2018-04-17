$(function() {
	var activityId = getUrlParam("Id") ? getUrlParam("Id") : 1; //活动id
	var _host = window.location.host; //路径配置
	var _isTest = _host.match('test') || $.trim(_host) == '' || _host.match('127.0'),
		_host = {
			$domain$: "http://" + (_isTest ? "test." : "") + "investfunds.hexun.com/",
			$attention$: "http://" + (_isTest ? "test" : "") + "follow.zq.hexun.com/",
			$xlj$: "http://" + (_isTest ? "test." : "") + "caidao.hexun.com/"
		};

	function getUrlParam(string) {
		//构造一个含有目标参数的正则表达式对象  
		var reg = new RegExp("(^|&)" + string + "=([^&]*)(&|$)");
		//匹配目标参数  
		var r = window.location.search.substr(1).match(reg);
		//返回参数值  
		if(r != null) return unescape(r[2]);
		return null;
	}

	var _isLogin = false;
	var checkPhone = new RealInformation(); //登录|电话验证
	//获取活动信息
	var a = 1
	$.ajax({
		type: "get",
		url: _host.$domain$ + "api/activity/getActivityInfo",
		dataType: "jsonp",
		data: {
			activityId: activityId
		},
		success: function(res) {
			var btntext = new Date(res.data.startTime)
			$(".redbtn").html((btntext.getMonth() + 1) + "月" + btntext.getDate() + "日 " + btntext.getHours() + ':' + btntext.getMinutes() + " 免费开抢")
			console.log(res)
			times(res)
			if((res.data.startTime - res.currentDate) <= 0) { //排行榜显示
				$(".phb").removeClass("hide")
			}
			if((res.data.startTime - res.currentDate) <= 10800000 && (res.data.endTime - res.currentDate) > 0) { //活动倒计时
				if((res.data.startTime - res.currentDate) <= 0) { //判断时间
					a = 0
					$('.redbtn').html('立即开抢');
					$(".redbtn").addClass("yuyue");
					userState(0)
				} else {
					var starttime = new Date(res.data.startTime);

					var djs = setInterval(function() {
						var nowtime = new Date(res.currentDate += 1000);
						var time = starttime - nowtime;
						var hour = parseInt(time / 1000 / 60 / 60 % 24);
						var minute = parseInt(time / 1000 / 60 % 60);
						var seconds = parseInt(time / 1000 % 60);
						if((res.data.startTime - res.currentDate) > 0) {
							$('.redbtn').html(hour + "小时" + minute + "分钟" + seconds + "秒" + "后开抢");
						}
						if(hour <= 0 && minute <= 0 && seconds <= 0 && (res.data.startTime - res.currentDate) <= 0) {
							$(".redbtn").addClass("yuyue");
							$('.redbtn').html('立即开抢');
							userState(0)
							clearInterval(djs)
						}

					}, 1000);
				}

			} else if((res.data.endTime - res.currentDate) <= 0) {
				$(".redbtn").removeClass().addClass("greybtn");
				$('.greybtn').html('名额已抢完');
			}
			if(a == 1) {
				userState(2)
			}

		}

	})

	function times(res) { //渲染服务器时间并根据服务器时间改变样式
		if(res.currentDate >= res.data.startTime) {
			if(res.currentDate >= res.data.startTime && res.currentDate >= res.data.act1Time) {
				$(".content div:eq(1)").removeClass("grey-div").addClass("red-div")

				if(res.currentDate >= res.data.act2Time && res.currentDate >= res.data.startTime && res.currentDate >= res.data.startTime) {
					$(".content div:eq(2)").removeClass("grey-div").addClass("red-div")
				}
			}
		}

		var atime = new Date(res.data.startTime)
		var btime = new Date(res.data.act1Time)
		var ctime = new Date(res.data.act2Time)

		$(".content div:eq(0) .days").html(atime.getMonth() + 1 + "月" + atime.getDate() + "日")
		$(".content div:eq(1) .days").html(btime.getMonth() + 1 + "月" + btime.getDate() + "日")
		$(".content div:eq(2) .days").html(ctime.getMonth() + 1 + "月" + ctime.getDate() + "日")

		$(".content div:eq(0) .timer").html(atime.toTimeString().slice(0, 5))
		$(".content div:eq(1) .timer").html(btime.toTimeString().slice(0, 5))
		$(".content div:eq(2) .timer").html(ctime.toTimeString().slice(0, 5))
	}

	//			$(".loading").parents(".black").removeClass("hide")

	function userState(state) { //判断用户状态
		$.ajax({
			type: "get",
			url: _host.$domain$ + "api/activity/checkUserStatus",
			dataType: "jsonp",
			data: {
				activityId: activityId
			},
			success: function(res) {
				console.log(res)
				if(res.errCode == 10000) { //可以预约
					if(state == 1) {
						setTimeout(function() {
							userState(1)
						}, 2000)
						$(".loading").parents(".black").removeClass("hide")
					}
				} else if(res.errCode == 20001) { //未登录
					_isLogin = false;
					checkPhone.init({
						isLogin: _isLogin,
						info: "为了确保活动奖品发放，<br>我们需要验证您的手机号。"
					}).then(function() {

					})
				} else if(res.errCode == 20002) { //已登录但未绑定手机号
					_isLogin = true;
					checkPhone.init({
						isLogin: _isLogin,
						info: "为了确保活动奖品发放，<br>我们需要验证您的手机号。"
					}).then(function() {

					})
				} else if(res.errCode == 20004) { //没有资格预约

				} else if(res.errCode == 20005) { //已经预约成功
					$(".redbtn").html("打开 APP 查看账户");
					if(state == 1) {
						$(".loading").parents(".black").addClass("hide")
						$(".b-success").parents(".black").removeClass("hide")
					}
				}

				if(state == 0) {
					reserve();
				}

			}
		}); //判断用户状态end
	}

	function reserve() { //预约
		$(".yuyue").click(function() {
			$.ajax({
				type: "post",
				url: _host.$domain$ + "api/activity/reserve",
				dataType: "jsonp",
				data: {
					activityId: activityId
				},
				success: function(res) {
					console.log(res)
					if(res.errCode == 10000) {
						setTimeout(function() {
							userState(1)
						}, 3000)
						$(".loading").parents(".black").removeClass("hide")
					} else if(res.errCode == 20001) { //没登录
						_isLogin = false;
						checkPhone.init({
							isLogin: _isLogin,
							info: "为了确保活动奖品发放，<br>我们需要验证您的手机号。"
						}).then(function() {

						})
					} else if(res.errCode == 20004) { //没绑定电话
						_isLogin = true;
						checkPhone.init({
							isLogin: _isLogin,
							info: "为了确保活动奖品发放，<br>我们需要验证您的手机号。"
						}).then(function() {

						})
					} else if(res.errCode == 20003) { //已经预约成功
						$(".b-success").parents(".black").removeClass("hide")
					} else if(res.errCode == 20002) { //没资格
						$(".wxts").parents(".black").removeClass("hide");
						$(".wxts-txt").text("本活动仅限新用户参与，");
					} else if(res.errCode == 20009 || res.errCode == 30000 || res.errCode == 20008) { //人数已满
						$(".wxts").parents(".black").removeClass("hide")
						$(".wxts-txt").text("实盘资金已经被抢光啦~");
						$(".redbtn").removeClass().addClass("greybtn");
						$('.greybtn').html('名额已抢完');
					}

				}
			});
		})
	} //预约end

	$(".teach-btn").click(function() { //关注
		$.ajax({
			type: "get",
			url: _host.$attention$ + "relation/add.do",
			async: true,
			data: {
				uid: "1037523",
				source: 2
			},
			dataType: "jsonp",
			success: function(res) {
				console.log(res)
				if(res.statecode == 10000) {
					checkPhone.init({
						isLogin: false
					}).then(function() {})
				} else {
					openwin(_host.$xlj$ + "1037523")
				}
			}
		});
	}) //关注end
	function openwin(url) {
    var a = document.createElement("a"); //创建a对象
    a.setAttribute("href", url);
    a.setAttribute("target", "_blank");
    document.body.appendChild(a);
    a.click(); //执行当前对象
	}

	$(".gb").on("click", function() { //知道了关闭按钮
		$(this).parents(".black").addClass("hide");
	})

	$(".close").on("click", function() { //弹窗关闭按钮
		$(this).parents(".black").addClass("hide");
	})

	$("#phb").on("click", function() { //排行榜

		$.ajax({
			type: "get",
			url: _host.$domain$ + "api/activity/getRankingUser",
			dataType: "jsonp",
			data: {
				activityId: activityId
			},
			success: function(res) {
				$(".b-list").parents(".black").removeClass("hide");
				console.log(res)
				var arr = res.data.results
				var str = "";
				var _class = "c-red";
				for(var i = 0; i < arr.length; i++) {
					if(arr[i].yields < 0) { //正负数0颜色
						_class = "c-green"
					} else if(arr[i].yields == 0) {
						_class = "c-000"
					} else {
						_class = "c-red"
					}
					str += "<li class='lis'>" +
						"<div class='fl list-num'><i>" + (i + 1) + "</i></div>" +
						"<div class='fl list-tx'><img src=" + arr[i].avatar + "></div>" +
						"<div class='fl list-name'>" +
						"<p class='yichu'>" + arr[i].nickName + "</p>" +
						"</div>" +
						"<div class='fl list-tum'>" +
						"<p class= " + _class + " >" + arr[i].yields + "%</p>" +
						"</div>" +
						"<div class='fl list-share'>" +
						"<p>" + arr[i].stockName + "\n" + arr[i].stockCode + "</p>" +
						"</div>" +
						"</li>"
				}

				$(".list-bg .clearfix").html(str)

				if($(".fl list-tum p").text() < 0) {
					$(".fl list-tum p").removeClass().addClass("c-green")
				}
				//前三名
				$(".list-bg .clearfix li:eq(0) .list-num i").html("").addClass("first")
				$(".list-bg .clearfix li:eq(1) .list-num i").html("").addClass("second")
				$(".list-bg .clearfix li:eq(2) .list-num i").html("").addClass("third")
			}

		})

	}) //排行榜end

})