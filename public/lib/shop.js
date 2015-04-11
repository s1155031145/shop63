refreshShopList();
	
function addToCart(pid){	
	var added = 0,
	list = JSON.parse(localStorage.getItem('list')); 
	if (list != null){
		for (var i = 0; i < list.shop_list.length; i++){
			if (list.shop_list[i].pid == pid){
				list.shop_list[i].quantity++;
				added = 1;
			}
		}
	} else {
	list = {"shop_list": []};
	}
	if (added == 0){
		var temp_shop_list = {"pid":pid, "quantity":"1"};
		list.shop_list.push(temp_shop_list);
	}
	localStorage.setItem('list', JSON.stringify(list)); 
	refreshShopList();
}

function refreshShopList(){
	if (localStorage.getItem('list') == null)
		localStorage.setItem('list', JSON.stringify({"shop_list": []}));
	var xhr = window.XMLHttpRequest? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");	
	var url = '/getShopList?list='+localStorage.getItem('list');	
	console.log(url);
	xhr.onreadystatechange=function(){
		if (xhr.readyState==4 && xhr.status==200){
			document.getElementById('shop_list').innerHTML = xhr.responseText;
		}
	}
	xhr.open("GET",url,true);
	xhr.send(null);
}

function changeQTY(pid,flag){
	list = JSON.parse(localStorage.getItem('list')); 
	if (flag == '1'){
		for (var i = 0; i < list.shop_list.length; i++){
			if (list.shop_list[i].pid == pid){
				list.shop_list[i].quantity++;
			}
		}
	} else {
		for (var i = 0; i < list.shop_list.length; i++){
			if (list.shop_list[i].pid == pid){
				if (list.shop_list[i].quantity > 1)
					list.shop_list[i].quantity--;
				else
					list.shop_list.splice(i,1);
			}
		}
	}
	localStorage.setItem('list', JSON.stringify(list)); 
	refreshShopList();
}