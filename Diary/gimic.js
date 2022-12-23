const init = function(){

	const div = document.createElement('div');

	const input = document.createElement('input');
	input.setAttribute("placeholder", "yyyymm");
	const btn = document.createElement('button');
	const btn2 = document.createElement('button');
	var Year;
	
	btn.innerText = "Clear";
	btn2.innerText = "jump";
	btn.addEventListener("click", e => {
		input.value = "";
	});
	btn2.addEventListener("click", e=>{
		location.href=+input.value.slice(0,4)+"/"+input.value+".html";
		})
	
	input.type = "text";
	
	div.append(input);
	
	div.append(btn);
	div.append(btn2);
	document.body.appendChild( div );
	
	const func = function(value){
		input.value += value;
	}

	const rd = new RotaryDial({callback: func});
	
}

init();