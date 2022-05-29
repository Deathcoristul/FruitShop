const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const bodyParser = require('body-parser')
const cookieParser=require('cookie-parser');
const session = require('express-session');
const request = require('express/lib/request');
const fs=require('fs');
const app = express();

const sqlite=require('sqlite3').verbose();

const port = 6789;

var db;

// directorul 'views' va conține fișierele .ejs (html + js executat la server)
app.set('view engine', 'ejs');
// suport pentru layout-uri - implicit fișierul care reprezintă template-ul site-ului este views/layout.ejs
app.use(expressLayouts);
// directorul 'public' va conține toate resursele accesibile direct de către client (e.g., fișiere css, javascript, imagini)
app.use(express.static('public'))
// corpul mesajului poate fi interpretat ca json; datele de la formular se găsesc în format json în req.body
app.use(bodyParser.json());
// utilizarea unui algoritm de deep parsing care suportă obiecte în obiecte
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
	secret:'secret',//secretul folosit pentru salvarea cookie-ului ID de sesiune
	resave:false,//forteaza sesiunea sa fie salvata inapoi in depozitul de sesiuniw
	saveUninitialized:false,
	cookie:{
		maxAge:100000//timp maxim de
	}
}));
app.use(function(req, res, next) {//parsare date intre pagini web, pentru a utiliza mai usor locals.session
    res.locals.session = req.session;
    next();//executa urmatoarea functie
});
const listaProduse=[
	{
		"id":"1",
		"nume":"Mere",
		"pret":"2"
	},
	{
		"id":"2",
		"nume":"Pere",
		"pret":"1"
	},
	{
		"id":"3",
		"nume":"Portocale",
		"pret":"2"
	},
	{
		"id":"4",
		"nume":"Kiwi",
		"pret":"4"
	},
	{
		"id":"5",
		"nume":"Căpșuni",
		"pret":"3"
	},
	{
		"id":"6",
		"nume":"Struguri",
		"pret":"2"
	},
	{
		"id":"7",
		"nume":"Banane",
		"pret":"3"
	},
	{
		"id":"8",
		"nume":"Piersici",
		"pret":"2"
	},
	{
		"id":"9",
		"nume":"Avocado",
		"pret":"5"
	}
];

// la accesarea din browser adresei http://localhost:6789/ se va returna textul 'Hello World'
// proprietățile obiectului Request - req - https://expressjs.com/en/api.html#req
// proprietățile obiectului Response - res - https://expressjs.com/en/api.html#res
//app.get('/', (req, res) => res.send('Hello World')); //lab10
app.get('/', (req, res) => {
	sql="SELECT * FROM produse ORDER BY id";
	if(fs.existsSync('public/cumparaturi.db'))
	{
		db = new sqlite.Database('public/cumparaturi.db',sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err)=>{
			if(err) {console.error(err.message);}
		});
		db.all(sql,[],(err,rows)=>{
			if(err) {
				console.error(err.message); 
				res.render('index',{name:req.session.fullname});
			}
			else{
				db.close();
				res.render('index',{name:req.session.fullname, tabel:rows});
			}
		});
	}
	else{
		res.render('index',{name:req.session.fullname});
		console.log(req.cookies);
	}
});

// la accesarea din browser adresei http://localhost:6789/chestionar se va apela funcția specificată
app.get('/chestionar', (req, res) => {
	const listaIntrebari = [
		{
			intrebare: 'Ce fruct le place maimuțelor?',
			variante: ['mărul', 'kiwi', 'banana', 'strugurile'],
			corect: 2
		},
		{
			intrebare: 'Fanta este cunoscut inițial un brand ce produce sucuri de ...',
			variante: ['struguri', 'portocale', 'roșii', 'pere'],
			corect: 1
		},
		{
			intrebare: 'Fructul cu cel mai mare aport caloric este ...',
			variante: ['avocado', 'căpșuna', 'para', 'kiwi'],
			corect: 0
		},
		{
			intrebare: 'Care fruct din listă nu e de pădure?',
			variante: ['afinele', 'zmeura', 'murele', 'căpșunile'],
			corect: 3
		},
		{
			intrebare: 'Care fruct din listă e exotic?',
			variante: ['para', 'ananasul', 'mărul', 'portocala'],
			corect: 1
		},
		{
			intrebare: 'Unii fermieri japoneji cresc pepeni verzi sub formă de ...',
			variante: ['sferă', 'piramidă', 'cub', 'prismă'],
			corect: 2
		},
		{
			intrebare: 'Care fruct poate avea mai mult de 1000 semințe?',
			variante: ['strugurele', 'portocala', 'pepenele', 'rodia'],
			corect: 3
		},
		{
			intrebare: 'Care fruct nu face parte din categoria citricelor?',
			variante: ['mărul', 'portocala', 'grefa', 'lămâia'],
			corect: 0
		},
		{
			intrebare: 'Ce fruct conține lapte?',
			variante: ['portocala', 'nuca de cocos', 'lămâia', 'piersica'],
			corect: 1
		},
		{
			intrebare: 'Cum se numesc strugurii uscați?',
			variante: ['pepeni', 'stafide', 'kiwi', 'prune'],
			corect: 1
		},
		//...
	];
	// în fișierul views/chestionar.ejs este accesibilă variabila 'intrebari' care conține vectorul de întrebări
	data=JSON.stringify(listaIntrebari);
	fs.writeFileSync('intrebari.json',data);
	res.render('chestionar', {intrebari: listaIntrebari});
});

app.post('/rezultat-chestionar', (req, res) => {
	console.log(req.body);
	let nrRaspCorecte=0;
	const data=fs.readFileSync('intrebari.json');
	const d=JSON.parse(data);
	console.log(d);
	for(let i=0;i<d.length;i++)
	{
		if(d[i].variante[d[i].corect]==req.body['question '+(i+1)]){
			nrRaspCorecte++;
		}
	}
	//res.send("formular: " + JSON.stringify(req.body) + "<br/>Rezultat: "+nrRaspCorecte+"/"+Object.keys(req.body).length);
	res.render('rezultat-chestionar',{number:nrRaspCorecte, total:d.length})
});
//lab11
app.post('/verificare-autentificare', (req, res) => {
	const data=fs.readFileSync('utilizatori.json');
	const d=JSON.parse(data);
	console.log(req.body);
	let check=false;
	for(let i=0;i<d.length;i++)
	{
		if(req.body['username']==d[i].utilizator && req.body['pass']==d[i].parola)
		{
			req.session.username=req.body['username'];
			req.session.fullname=d[i].nume +" "+ d[i].prenume;
			req.session.loggedin=true;
			req.session.access=d[i].access;
			req.session.addIDs=[];
			res.cookie("username",req.body['username']);
			check=true;
			res.redirect('/');
		}
	}
	if(!check)
	{
		res.cookie("mesajEroare","Utilizatorul sau parola greșite!","expires="+(new Date(Date.now()+2000).toUTCString));
		res.redirect('/autentificare');
	}
})
app.get('/autentificare',(req, res) => {
	if(req.cookies["mesajEroare"])
		res.clearCookie("mesajEroare");
	res.render('autentificare',{error:req.cookies['mesajEroare']});
})
app.get('/logout',(req,res) => {
	req.session.loggedin=false;
	req.session.username=null;
	req.session.fullname=null;
	req.session.access=null;
	req.session.addIDs=[];
	res.clearCookie('username');
    req.session.destroy();
    res.redirect('/');
});
//lab12
app.get('/creare-bd',(req,res) => {
	if(!fs.existsSync('public/cumparaturi.db'))
	{
		fs.writeFileSync('public/cumparaturi.db','',function(err){
			if (err) {
                console.error(err);
            }
  			console.log('Baza de date creata.');
		})
	}
	
	db = new sqlite.Database('public/cumparaturi.db',sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err)=>{
		if(err) {
			console.error(err.message); 
		}
	});
	var sql = "CREATE TABLE produse(id INTEGER PRIMARY KEY AUTOINCREMENT, nume VARCHAR(255),pret INTEGER)";
	db.run(sql,function (err) {
		if (err) {
			console.error(err);
		}
	});
	db.close();
	res.redirect('/');
})

app.get('/inserare-bd',(req,res) => {
	
	if(fs.existsSync('public/cumparaturi.db'))
	{
		db = new sqlite.Database('public/cumparaturi.db',sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err)=>{
			if(err) {console.error(err.message);}
		});
		var sql = "INSERT INTO produse(id,nume,pret) VALUES(?,?,?)";
		for(let i =0 ;i<listaProduse.length;i++)
		{
			db.run(sql, [listaProduse[i].id,listaProduse[i].nume,listaProduse[i].pret], (err) => {
				if (err) { console.error(err.message); }
			});
		}
		db.close();
		
	}
	res.redirect('/');
})
app.post('/adaugare-cos',(req,res) => {
	console.log(req.body['id']);
	req.session.addIDs.push(req.body['id']);
	if(fs.existsSync('public/cumparaturi.db'))
	{
		db = new sqlite.Database('public/cumparaturi.db',sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err)=>{
			if(err) {console.error(err.message);}
		});
		db.all(sql,[],(err,rows)=>{
			if(err) {
				console.error(err.message); 
			}
			else{
				db.close();
				res.render('vizualizare-cos',{list:rows});
			}
		});
	}
	else{
		res.render('vizualizare-cos');
	}
})
app.get('/vizualizare-cos',(req,res) => {
	if(fs.existsSync('public/cumparaturi.db'))
	{
		db = new sqlite.Database('public/cumparaturi.db',sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err)=>{
			if(err) {console.error(err.message);}
		});
		db.all(sql,[],(err,rows)=>{
			if(err) {
				console.error(err.message); 
			}
			else{
				db.close();
				res.render('vizualizare-cos',{list:rows});
			}
		});
	}
	else{
		res.render('vizualizare-cos');
	}
})
//lab13
app.get('/admin',(req,res) => {
	if(req.session.access=="admin")
	{
		res.render('admin');
	}
	else{
		res.redirect("/");
	}
})
app.post('/adaugare-produs',(req,res) => {
	if(req.session.access=="admin")
	{
		if(fs.existsSync('public/cumparaturi.db'))
		{
			db = new sqlite.Database('public/cumparaturi.db',sqlite.OPEN_READWRITE | sqlite.OPEN_CREATE, (err)=>{
				if(err) {console.error(err.message);}
			});
			var sql = "INSERT INTO produse(nume,pret) VALUES(?,?)";
			db.run(sql, [req.body['prodname'],req.body['price']], (err) => {
				if (err) { console.error(err.message); }
			});
			db.close();
			
		}
	}
	res.redirect("/");
})
app.listen(port, () => console.log(`Serverul rulează la adresa http://localhost:6789`));

