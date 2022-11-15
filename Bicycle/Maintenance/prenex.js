function onLink(i){

const path = document.URL;

const resultPath = path.split("/").reverse().slice(1).reverse().join("/");
var filename = path.split("/").reverse()[0].split('.')[0];

 
  filename=(parseInt(filename)+i);
   
  if(filename== -1)
  {

	  filename--;
	  
	  if(filename==-2){
		  
     document.getElementById('discription').innerHTML = "最初のページです" ;
	 return;
	 }
  }
	 else
  {
	 location.href=filename+".html";
	}
	
	
}
