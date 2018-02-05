

const watch = require('node-watch');
const showdown  = require('showdown')
const converter = new showdown.Converter()
const fse = require('fs-extra')
const fs = require('fs')
const fm = require('front-matter')
const must = require ('mustache');
const glob = require('glob')
const path  =require('path')
var slug = require('slug')
var liveServer = require("live-server");


const source_dir="./source"
const output_dir="./output"
const template_dir="./template" 
const file_extension="html"

var page_menu=[]
var post_list=[]

var params = {
	port: 8000, // Set the server port. Defaults to 8080.
	host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
	root: "output", // Set root directory that's being served. Defaults to cwd.
	open: true, // When false, it won't load your browser by default.
	ignore: 'scss', // comma-separated string for paths to ignore
	file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
	logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
};

var generateMenu = function(){
    glob(source_dir+"/pages/**.md", function (er, files) {
        files.forEach((file)=>{
            fse.readFile(file,'UTF8',(err,data)=>{            

                const frontmatter_data = fm(data)         
                const filec_name = path.basename(file).replace('.md','');
                const order = parseInt(filec_name.split('.')[0])
                const file_name=filec_name.split('.')[1]
                const out_file_name = (frontmatter_data.attributes.slug || file_name)+'.'+file_extension;
                
               page_menu.push(
                    {title:frontmatter_data.attributes.title,
                     page_link:'/'+out_file_name,
                     order:order,
                     category:frontmatter_data.attributes.category
                    });

                page_menu = page_menu.sort((a,b)=>{
                    if (a.order < b.order)
                        return -1;
                    if (a.order > b.order)
                        return 1;
                    return 0;
                    });
            })  
        });
    });
}



var generatePage = function(file){
    
    const templatefile = 'template/index.html'
    const menu = fse.readFileSync('template/_menu.html','UTF8')
    const postlist = fse.readFileSync('template/_postlist.html','UTF8')

    fse.readFile(templatefile,'UTF8', (err,data)=>{
        var template = data    
        fse.readFile(file,'UTF8',(err,data)=>{            
            
            const frontmatter_data = fm(data)      
            const filec_name = path.basename(file).replace('.md','');
            const order = parseInt(filec_name.split('.')[0])
            const file_name=filec_name.split('.')[1]
            var out_file_name = (frontmatter_data.attributes.slug || file_name)+'.'+file_extension;
            var html = converter.makeHtml(frontmatter_data.body);
            
            fs.stat(file,(err,stat)=>{

                var page_data = {
                    title:frontmatter_data.attributes.title,
                    publish_date:frontmatter_data.attributes.publish_date || stat.atime,
                    content:html,
                    menu:page_menu,
                    posts:post_list
                }

                var rendered = must.render(template,page_data,{ menu:menu ,posts_menu: postlist })

                fse.writeFile('output/'+out_file_name,rendered);
               
                console.log("Generated %s", out_file_name)

            })
        });
    });    
}


var generatePost = function(file){
    
    const templatefile = 'template/index.html'
    const menu = fse.readFileSync('template/_menu.html','UTF8')
    const postlist = fse.readFileSync('template/_postlist.html','UTF8')

    fse.readFile(templatefile,'UTF8', (err,data)=>{
        var template = data    
        fse.readFile(file,'UTF8',(err,data)=>{     

            const frontmatter_data = fm(data)         
            const file_name = path.basename(file).replace('.md','');
            const out_file_name = (frontmatter_data.attributes.slug || file_name)+'.'+file_extension;
            var html = converter.makeHtml(frontmatter_data.body);
            
            fs.stat(file,(err,stat)=>{

                var page_data = {
                    title:frontmatter_data.attributes.title,
                    publish_date:frontmatter_data.attributes.publish_date || stat.atime,
                    content:html,
                    menu:page_menu,
                    posts:post_list
                }

                var rendered = must.render(template,page_data,{ menu:menu ,posts_menu: postlist })

                fse.writeFile('output/posts/'+out_file_name,rendered);
               
                console.log("Generated %s", out_file_name)

            })
        });
    });    
}

var generatePostList = function(){
    glob(source_dir+"/posts/**.md", function (er, files) {
        files.forEach((file)=>{
            fse.readFile(file,'UTF8',(err,data)=>{            

                const frontmatter_data = fm(data)         
                const file_name = path.basename(file).replace('.md','');
                const out_file_name = (frontmatter_data.attributes.slug || file_name)+'.'+file_extension;
                
               post_list.push(
                    {title:frontmatter_data.attributes.title,
                     page_link:'/posts/'+out_file_name,
                     category:frontmatter_data.attributes.category
                });
            })  
        });
    });
}

const refresh = function(){
    fse.emptyDir(output_dir, err => {
        if (err) return console.error(err)
        
            fse.ensureDirSync(output_dir+'/posts/')
        
            console.log("Loading pages")
            glob(source_dir+"/pages/**.md", function (er, files) {
                files.forEach((file)=>{
                    console.log("Woirking on : " + file)             
                    generatePage(file)
                });
            })    
            glob(source_dir+"/posts/**.md", function (er, files) {
                files.forEach((file)=>{
                    console.log("Woirking on : " + file)             
                    generatePost(file)
                });
            })    
            console.log("Loading root")
            glob(source_dir+"/*.md", function (er, files) {
                files.forEach((file)=>{
                    console.log("Woirking on : " + file)             
                    generatePage(file)
                });
            })
            console.log('success!')
      });
    
    
}

generateMenu()
generatePostList()
refresh()

watch(source_dir, { recursive: true }, function(evt, name) {
    refresh(name)
});

watch(template_dir, { recursive: true }, function(evt, name) {
    console.log('Template change... Refresh all')
    refresh(name)
});

liveServer.start(params);





