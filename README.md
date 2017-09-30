# A Hotload Module Loader for the Web

legojs is a module loader for the web,which support hotload. It is especially for in-browser use. here is just an overview. you can get more detail at legojs 中文文档


## Features #

- function is not fired until dependencies have loaded
- hotload supported

## browser supported

ie6+ and all modern browsers

## Basic Usage 

you can copy the code directly to the browser console to check the result

## define a module
	//define m1
    define('m1',function(){
    	return {
			v:'v1'
		}
	});
	
	//require m1
	require(['m1'],function(m1){
		console.log(m1.v);
	});
	
	//define m2 whitch depend m1
    define('m2',['m1'],function(m1){
		//This function is called when m1 is ready.
		var v='m2_'+m1.v
    	return {
			v:v
		};
	});
	require(['m2'],function(m2){
		console.log(m2.v);//output m2_v1
	});
	
## Hotload usage

continue basic usage code

    //redefine m1
	define('m1',function(){
    	return {
			v:'v2'
		}
	});
	//require m1 again 
	require(['m1'],function(m1){
		console.log(m1.v);  //output v2
	});

	//require m2 again, m2 will also update the output
	require('m2',function(m2){
		console.log(m2.v) //output m2_v2
	}
	
### load function and unload function

	//count will be reset when reload counter
	define('counter',function(){
		var count=0;
		document.getElementById('button').onlick=function(){
			count++;
		}
    	return {
			count:count
		}
	});
	
if button has  clicked for three times , variable count will be 3. redefine module counter, variable count will reset to 0. using load,unload function can avoid it. load is similar to constructor,unload is similar to destructor.

	//we can save value in destructor,and recover it in constructor
	define('counter',function(){
		var count=0;
		document.getElementById('button').onlick=function(){
			count++;
		}
		this.load=function(preservedData){
			count=preservedData.count;
		}
		this.unload=function(){
			var preservedData={
				count:count
			}
			return preservedData;
		}
    	return {
			count:count
		}
	});


you also can clean up in unload. for eamaple,click handler will double binded whe redefine counter

    define('counter',function(){
		var count=0;
		function onClick(){
			count++;
		}
		document.getElementById('button').addEventListener('click',onClick);

    	return {
			count:count
		}
	}
		

you can clean up event bind in unload function

	 define('counter',function(){
		var count=0;
		var button=document.getElementById('button');
		function onClick(){
			count++;
		}
		button.addEventListener('click',onClick);
		
		this.unload=function(){
			button.removeEventListener('click',onClick);
		}
    	return {
			count:count
		}
	});

## License

Legojs.js is available under the terms of the MIT License

