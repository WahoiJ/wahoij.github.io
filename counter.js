function onGuard()
{
	document.getElementById('discription').innerHTML = "tru" ;
	(window,document,"script","https://counter1.fc2.com/counter_img.php?id=14567688&main=1","test")
}


if (!self._FC2COUNTER14567688_1)
{
	var _FC2COUNTER14567688_1 =
	{
		
		id:14567688,
		graph_img:null,
		show_graph:function(e)
		{
			if (this.graph_img == null )
			{
				var img = this.graph_img = document.createElement('img');
				img.src = 'https://counter1-cdn-ssl.fc2.com/popup.php?id=14567688&main=1&lang=0';
				img.style.visibility = 'hidden';
				img.style.position = 'absolute';
				img.style.zIndex = 10000;
				img.style.margin = '0px';
				img.style.padding = '0px';
				img.width = 260;
				img.height = 130;
				document.body.insertBefore(img, document.body.firstChild);
			}
			var counterh = 20;
			var X,Y,L,T,W,H;
			if (document.all && !window.opera)
			{
				var csscompat=((document.compatMode||"").indexOf("CSS")!=-1);
				var b=(csscompat?document.documentElement:document.body);
				X = b.scrollLeft;
				Y = b.scrollTop;
				L = (e.clientX - e.offsetX - 2 + X);
				T = (e.clientY - e.offsetY - 2 + Y);
				W = b.clientWidth - 16;
				H = b.clientHeight - 16;
			} else {
				X = window.pageXOffset;
				Y = window.pageYOffset;
				L = e.pageX;
				T = e.pageY;
				W = window.innerWidth - 16;
				H = window.innerHeight - 16;}T += counterh;
			if ( W > 0 && L + this.graph_img.width > X + W ) L = X + W - this.graph_img.width;
			if ( L < X ) L = X;
			//if ( H > 0 && T + this.graph_img.height > Y + H ) T = Y + H - this.graph_img.height;
			if ( T < Y ) T = Y;
			this.graph_img.style.left = L + 'px';
			this.graph_img.style.top = T + 'px';
                     this.graph_img.style.display="inline";
			this.graph_img.style.visibility="visible";
		},
		hide_graph:function(e){
			if (this.graph_img)
			{
				this.graph_img.style.visibility="hidden";
			}
		},
		visit_info:function()
		{
			var time = new Date();
			var now = Math.floor(time.getTime()/1000);
			var version = 1, is_first, is_unique;
			var info = [version, 0];
			var cookie_name = "fc2cnt_" + this.id;
			var reg = (" " + document.cookie + ";").match(new RegExp(" " + cookie_name + "=([\\d\\-]+);"));
			if(reg)
			{
				info = reg[1].split("-");
				is_first = false;
				is_unique = (now - info[1] > 60*60*24);
			}
			else
			{
				is_first = true;
				is_unique = true;
			}
			time.setTime(time.getTime()+30*86400*1000);
			document.cookie = cookie_name + "="
				+ [
					version,
					(is_unique ? now : info[1])
				].join("-")
				+ " ; expires=" + time.toGMTString();
			return (is_first ? '2' : (is_unique ? '1' : '0'));
		},
		disp_js:function()
		{
			var current = false;
			if('currentScript' in document && 'parentNode' in document.currentScript && document.currentScript.parentNode != null && 'tagName' in document.currentScript.parentNode && document.currentScript.parentNode.tagName.toUpperCase() != 'HEAD'){
				current = document.currentScript
			}else{
				current = false;
			}
			if(!current){
			document.write('<script type="text/javascript" language="javascript"'
				+ ' src="https://counter1.fc2.com/counter_js.php?id=14567688&main=1&lang=0'
				+ '&amp;visitor=' + this.visit_info()
				+ '" charset="UTF-8"></'+'script>');
			}else{
			const script = document.createElement('script');
			script.src = "https://counter1.fc2.com/counter_js.php?id=14567688&main=1&lang=0&visitor=" + this.visit_info();
			script.charset="UTF-8";
			current.parentNode.appendChild(script); 
			}
		}
	}
}
_FC2COUNTER14567688_1.disp_js();