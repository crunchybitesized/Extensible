/* 
 * DAVID BELAIS 2010 DAVID@DISSENTGRAPHICS.COM
 */

(function(dom){
	var storeURI=true;
	if(dom.extensible){
		dom.extensible.builderURI=fl.scriptURI;
	}
	function copy(source,destination){
		var success=true;
		if(FLfile.exists(destination)){
			success=FLfile.remove(destination)
		}
		if(success){
			var isDir=FLfile.getAttributes(source).indexOf('D')>-1;
			if(isDir){
				success=FLfile.createFolder(destination);
				if(success){
					var ch=FLfile.listFolder(source);
					for(var i=0;i<ch.length;i++){
						success=(
							copy(source+'/'+ch[i],destination+'/'+ch[i]) &&
							success 
						);
					}
				}
			}else{
				var moveDir=destination.replace(/\/?[^\/]*?$/g,"");
				if(!FLfile.exists(moveDir)){
					success=FLfile.createFolder(moveDir);
				}
				if(storeURI){
					var fileName=source.split('/').pop();
					var builderXML,scriptXML;
					if(FLfile.exists(moveDir+'/'+'.builders')){
						builderXML=new XML(FLfile.read(moveDir+'/'+'.builders'));
						if(builderXML && builderXML.length()){
							try{
								scriptXML=builderXML.script.(@file==fileName);
								if(scriptXML && scriptXML.length()){
									delete builderXML.script.(@file==fileName);
								}
							}catch(e){
								delete builderXML.script;
							}
						}else{
							builderXML=<builders />;
						}
					}else{
						builderXML=<builders />;
					}
					scriptXML=<script type="text/jsfl" builder={fl.scriptURI} file={fileName} />;
					builderXML.appendChild(scriptXML);
					FLfile.write(moveDir+'/'+'.builders',builderXML.toXMLString());
				}
				if(success){
					success=FLfile.copy(source,destination);
					if(!success){
						success=FLfile.write(
							destination,
							FLfile.read(source)
						);
					}
				}
			}
		}
		return success;
	}
	var config=decodeURI(fl.configURI).match(/(^.*)(?=\/Flash CS.)/);
	if(config && config.length>1){
		var configURI=[];
		var folders=FLfile.listFolder(config[0],'directories"');
		for(var i=0;i<folders.length;i++){
			if(/^Flash CS\d$/.test(folders[i])){
				var langFolder=FLfile.listFolder(config[0]+'/'+folders[i],'directories');
				for(var n=0;n<langFolder.length;n++){
					configURI.push(
						config[0]+'/'+folders[i]+'/'+langFolder[n]+'/Configuration'
					);
				}
			}
		}
		var dir=(fl.scriptURI.replace(/\/?[^\/]*?$/g,""));
		var mxi=FLfile.listFolder(dir).filter(
			function(element,index,array){
				return(/\.mxi$/.test(element));
			}
		);
		var success,n;
		var completed=[];
		for(i=0;i<mxi.length;i++){
			var xmlString=FLfile.read(dir+'/'+mxi[i]);
			for(n=0;n<configURI.length;n++){
				success=copy(dir+'/'+mxi[i],configURI[n]+'/Extensions/'+mxi[i]);
				if(!success){
					fl.trace('Problem copying "'+dir+'/'+mxi[i]+'" to "'+configURI[n]+'/Extensions/'+mxi[i]+'"');
				}
			}
			if(xmlString){
				var xml=new XML(xmlString.replace(/\<\?.*?\?\>/,''));
				for each(var file in xml..files.file){
					var relativePath=String(file.@source);
					if(completed.indexOf(relativePath)<0){
						completed.push(relativePath);
						var sourceURI=dir+'/'+relativePath;
						if(FLfile.exists(sourceURI)){
							var isDir=FLfile.getAttributes(sourceURI).indexOf('D')>-1;
							var destinationTemplate=String(file.@destination)+'/'+relativePath.split('/').pop();
							var re=/^\$flash/;					
							for(n=0;n<configURI.length;n++){
								var destinationURI=destinationTemplate.replace(re,configURI[n]);
								success=copy(sourceURI,destinationURI);
								if(!success){
									fl.trace('Problem copying '+sourceURI+' to '+destinationURI);
								}
							}
						}else{
							fl.trace(sourceURI+' does not exist.');
						}
					}
				}
			}
		}
	}
})(this)