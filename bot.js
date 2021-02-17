const Discord = require('discord.js');
const client = new Discord.Client();
const ayarlar = require('./ayarlar.json');
const chalk = require('chalk');
const fs = require('fs');
const moment = require('moment');
const db = require('quick.db');

 
require('./util/eventLoader')(client);

var prefix = ayarlar.prefix;

const log = message => {
  console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] ${message}`);
};

client.commands = new Discord.Collection();
client.aliases = new Discord.Collection();
fs.readdir('./komutlar/', (err, files) => {
  if (err) console.error(err);
  log(`${files.length} komut yüklenecek.`);
  files.forEach(f => {
    let props = require(`./komutlar/${f}`);
    log(`Yüklenen komut: ${props.help.name}.`);
    client.commands.set(props.help.name, props);
    props.conf.aliases.forEach(alias => {
      client.aliases.set(alias, props.help.name);
    });
  });
});

client.reload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.on('guildBanAdd' , (guild, user) => {
  let aramızakatılanlar = guild.channels.find('name', 'aramıza-katılanlar');
  if (!aramızakatılanlar) return;
  aramızakatılanlar.send('https://media.giphy.com/media/8njotXALXXNrW/giphy.gif **Adalet dağıtma zamanı gelmiş!** '+ user.username +'**Bakıyorum da suç işlemiş,Yargı dağıtmaya devam** :fist: :writing_hand:  :spy:' );
});

client.load = command => {
  return new Promise((resolve, reject) => {
    try {
      let cmd = require(`./komutlar/${command}`);
      client.commands.set(command, cmd);
      cmd.conf.aliases.forEach(alias => {
        client.aliases.set(alias, cmd.help.name);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.unload = command => {
  return new Promise((resolve, reject) => {
    try {
      delete require.cache[require.resolve(`./komutlar/${command}`)];
      let cmd = require(`./komutlar/${command}`);
      client.commands.delete(command);
      client.aliases.forEach((cmd, alias) => {
        if (cmd === command) client.aliases.delete(alias);
      });
      resolve();
    } catch (e){
      reject(e);
    }
  });
};

client.on('message', msg => {
  if (msg.content.toLowerCase() === 'sa') {
      msg.reply(new Discord.MessageEmbed().setColor("RANDOM").setDescription(`Aleyküm Selam, İyi Eğlenceler!`))
}
});

client.elevation = message => {
  if(!message.guild) {
	return; }
  let permlvl = 0;
  if (message.member.hasPermission("BAN_MEMBERS")) permlvl = 2;
  if (message.member.hasPermission("ADMINISTRATOR")) permlvl = 3;
  if (message.author.id === ayarlar.sahip) permlvl = 4;
  return permlvl;
};
function percentage(partialValue, totalValue) {
  return (100 * partialValue) / totalValue;
} 

client.on('message', async(message) => {
if (!message.guild) return
let acikmi = await db.fetch(`${message.guild.id}.capsengel`)
if (!acikmi) return
if (message.author.bot) return
if (message.member.hasPermission("MANAGE_MESSAGES")) return
let matched = message.content.replace(/[^A-Z]/g, "").length
let yuzde = percentage(matched, message.content.length)
if (Math.round(yuzde) > acikmi.yuzde) {
 message.delete()
 message.author.send(new Discord.MessageEmbed().setColor("RED").setTimestamp().setFooter(`${message.guild.name}`,message.guild.iconURL({dynamic:true})).setAuthor("CapsLock Engelleme Sistemi").setDescription("**Uyarı! "+message.guild.name+" sunucusunda büyük harfle yazma engeli bulunmaktadır!**\nBu sebepten göndermiş olduğunuz mesaj silindi."))
 message.channel.send(new Discord.MessageEmbed().setColor("RED").setTimestamp().setFooter(`${message.guild.name}`,message.guild.iconURL({dynamic:true})).setAuthor("CapsLock Engelleme Sistemi",message.author.displayAvatarURL({dynamic:true})).setDescription(message.author.username+" - "+(message.member.nickname ? `${message.member.nickname} - ${message.author.id}` : message.author.id)+"\n**Uyarı!  Bu sunucuda büyük harfle yazma engeli bulunmaktadır!**\nBu sebepten göndermiş olduğunuz mesaj silindi.")).then(msg=>msg.delete({timeout:3000}))
}else{return}
})
client.on("message", async message => {
  if (!message.guild) return;

  if (db.has(`sayac_${message.guild.id}`) === true) {
    if (db.fetch(`sayac_${message.guild.id}`) <= message.guild.members.cache.size) {
      const embed = new Discord.MessageEmbed()
        .setTitle(`Tebrikler ${message.guild.name}!`)
        .setDescription(`Başarıyla \`${db.fetch(`sayac_${message.guild.id}`)}\` kullanıcıya ulaştık! Sayaç sıfırlandı!`)
        .setColor("RANDOM");
      message.channel.send(embed);
      message.guild.owner.send(embed);
      db.delete(`sayac_${message.guild.id}`);
    }
  }
});
client.on("guildMemberRemove", async member => {
  const channel = db.fetch(`sKanal_${member.guild.id}`);
  if (db.has(`sayac_${member.guild.id}`) == false) return;
  if (db.has(`sKanal_${member.guild.id}`) == false) return;

    member.guild.channels.cache.get(channel).send(`**${member.user.tag}** Sunucudan ayrıldı! \`${db.fetch(`sayac_${member.guild.id}`)}\` üye olmamıza son \`${db.fetch(`sayac_${member.guild.id}`) - member.guild.memberCount}\` üye kaldı!`);
});
client.on("guildMemberAdd", async member => {
  const channel = db.fetch(`sKanal_${member.guild.id}`);
  if (db.has(`sayac_${member.guild.id}`) == false) return;
  if (db.has(`sKanal_${member.guild.id}`) == false) return;

    member.guild.channels.cache.get(channel).send(`**${member.user.tag}** Sunucuya Katıldı :tada:! \`${db.fetch(`sayac_${member.guild.id}`)}\` üye olmamıza son \`${db.fetch(`sayac_${member.guild.id}`) - member.guild.memberCount}\` üye kaldı!`);
});

//Güvenlik Komutunun Main Dosyası.
client.on('guildMemberAdd', member => {
  let kanal = db.fetch(`güvenlik.${member.guild.id}`)
  if(!kanal) return;

    let aylar = {
            "01": "Ocak",
            "02": "Şubat",
            "03": "Mart",
            "04": "Nisan",
            "05": "Mayıs",
            "06": "Haziran",
            "07": "Temmuz",
            "08": "Ağustos",
            "09": "Eylül",
            "10": "Ekim",
            "11": "Kasım",
            "12": "Aralık"
 }

let bitiş = member.user.createdAt
   let günü = moment(new Date(bitiş).toISOString()).format('DD')
   let ayı = moment(new Date(bitiş).toISOString()).format('MM').replace("01", "Ocak").replace("02","Şubat").replace("03","Mart").replace("04", "Nisan").replace("05", "Mayıs").replace("06", "Haziran").replace("07", "Temmuz").replace("08", "Ağustos").replace("09", "Eylül").replace("10","Ekim").replace("11","Kasım").replace("12","Aralık").replace("13","CodAre")//codare
  let yılı =  moment(new Date(bitiş).toISOString()).format('YYYY')
  let saati = moment(new Date(bitiş).toISOString()).format('HH:mm')

let günay = `${günü} ${ayı} ${yılı} ${saati}`  

   let süre = member.user.createdAt
   let gün = moment(new Date(süre).toISOString()).format('DD')
   let hafta = moment(new Date(süre).toISOString()).format('WW')
   let ay = moment(new Date(süre).toISOString()).format('MM')
   let ayy = moment(new Date(süre).toISOString()).format('MM')
   let yıl =  moment(new Date(süre).toISOString()).format('YYYY')
  let yıl2 = moment(new Date().toISOString()).format('YYYY')

  let netyıl = yıl2 - yıl

  let created = ` ${netyıl} yıl  ${ay} ay ${hafta} hafta ${gün} gün önce`

  let kontrol;
  if(süre < 1296000000) kontrol = 'Bu hesap şüpheli!'
  if(süre > 1296000000) kontrol = 'Bu hesap güvenli!'

  let codare = new Discord.MessageEmbed()
  .setColor('GREEN')
  .setTitle(`${member.user.username} Katıldı`)
  .setDescription('<@'+member.id+'> Bilgileri : \n\n  Hesap oluşturulma tarihi **[' + created + ']** (`' + günay + '`) \n\n Hesap durumu : **' + kontrol + '**')//codare
  .setTimestamp()
  client.channels.cache.get(kanal).send(codare)
})




//AFK Komutunun Main Dosyası
client.on("message" , async msg => {
  
  if(!msg.guild) return;
  if(msg.content.startsWith(ayarlar.prefix+"afk")) return; 
  
  let afk = msg.mentions.users.first()
  
  const kisi = db.fetch(`afkid_${msg.author.id}_${msg.guild.id}`)
  
  const isim = db.fetch(`afkAd_${msg.author.id}_${msg.guild.id}`)
 if(afk){
   const sebep = db.fetch(`afkSebep_${afk.id}_${msg.guild.id}`)
   const kisi3 = db.fetch(`afkid_${afk.id}_${msg.guild.id}`)
   if(msg.content.includes(kisi3)){

       msg.reply(`Etiketlediğiniz Kişi Afk \nSebep : ${sebep}`)
   }
 }
  if(msg.author.id === kisi){

       msg.reply(`Afk'lıktan Çıktınız`)
   db.delete(`afkSebep_${msg.author.id}_${msg.guild.id}`)
   db.delete(`afkid_${msg.author.id}_${msg.guild.id}`)
   db.delete(`afkAd_${msg.author.id}_${msg.guild.id}`)
    msg.member.setNickname(isim)
    
  }
  //Link Engel
  client.on("message", async  msg => {
    var mayfe = await db.fetch(`reklam_${msg.guild.id}`)
       if (mayfe == 'acik') {
           const birisireklammidedi = [".com", ".net", ".xyz", ".tk", ".pw", ".io", ".me", ".gg", "www.", "https", "http", ".gl", ".org", ".com.tr", ".biz", "net", ".rf.gd", ".az", ".party", "discord.gg",];
           if (birisireklammidedi.some(word => msg.content.includes(word))) {
             try {
               if (!msg.member.hasPermission("BAN_MEMBERS")) {
                     msg.delete();
                       return msg.reply('Bu Sunucuda Reklam Engelleme Filtresi Aktiftir. Reklam Yapmana İzin Veremem !').then(msg => msg.delete(3000));
       
   
     msg.delete(3000);                              
   
               }              
             } catch(err) {
               console.log(err);
             }
           }
       }
       else if (mayfe == 'kapali') {
         
       }
       if (!mayfe) return;
     })
  
});
client.on("roleDelete", async role => {
  let kanal = await db.fetch(`rolk_${role.guild.id}`);
  if (!kanal) return;
  const entry = await role.guild
    .fetchAuditLogs({ type: "ROLE_DELETE" })
    .then(audit => audit.entries.first());
  if (entry.executor.id == client.user.id) return;
  if (entry.executor.id == role.guild.owner.id) return;
  if(!entry.executor.hasPermission('ROLE_DELETE')) {
      role.guild.roles.create({
    name: role.name,
    color: role.hexColor,
    permissions: role.permissions
  });
   let emran = new Discord.MessageEmbed()
   .setColor('0x36393E')
   .setTitle(`Bir rol silindi !`)
   .setDescription(`Silinen rol adı ${role.name}, Rol koruma sistemi açık olduğu için rol geri oluşturuldu!`)
   client.channels.cache.get(kanal).send(emran)
  }
});
client.on("channelDelete", async function(channel) {
  if(channel.guild.id !== "sunucu id") return;
      let logs = await channel.guild.fetchAuditLogs({type: 'CHANNEL_DELETE'});
      if(logs.entries.first().executor.bot) return;
      channel.guild.member(logs.entries.first().executor).roles.filter(role => role.name !== "@everyone").array().forEach(role => {
                channel.guild.member(logs.entries.first().executor).removeRole(channel.guild.roles.get("alıncak rol 1"))
                channel.guild.member(logs.entries.first().executor).removeRole(channel.guild.roles.get("alıncak rol 2"))
      })
  const sChannel = channel.guild.channels.find(c=> c.id ==="log kanal id")
  const cıks = new Discord.RichEmbed()
  .setColor('RANDOM')
  .setDescription(`${channel.name} adlı Kanal silindi Silen kişinin yetkilerini  çekiyom moruk çıkssss :tiks:`)
  .setFooter('Rol Koruma')
  sChannel.send(cıks)
    
  channel.guild.owner.send(` **${channel.name}** adlı Kanal silindi Silen  kişinin yetkilerini aldım:tiks:`)
  }) 
  //BOT ENGEL,anti-baskın yada anti-raid
client.on("guildMemberAdd", async member => {// Yapımı Tamamen CodAre'den '~'Resađ Seferov✨#0809 a aitdir
let kanal = await db.fetch(`antiraidK_${member.guild.id}`)== "anti-raid-aç"
  if (!kanal) return;  
  var cod = member.guild.owner
  if (member.user.bot === true) {
     if (db.fetch(`botizin_${member.guild.id}.${member.id}`) == "aktif") {
    let are = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setThumbnail(member.user.avatarURL)
      .setDescription(`**${member.user.tag}** (${member.id}) adlı bota bir yetkili verdi eğer kaldırmak istiyorsanız **${prefix}bot-izni kaldır botun_id**.`);
    cod.send(are);//CodAre✨
     } else {
       let izinverilmemişbot = new Discord.MessageEmbed()
      .setColor("RANDOM")
      .setThumbnail(member.user.avatarURL)
      .setDescription("**" + member.user.tag +"**" + " (" + member.id+ ") " + "adlı bot sunucuya eklendi ve banladım eğer izin vermek istiyorsanız **" + prefix + "bot-izni ver botun_id**")
       member.kick();// Eğer sunucudan atmak istiyorsanız ban kısmını kick yapın
       cod.send(izinverilmemişbot)
}
  }
});
// eklendim
client.on('guildCreate', async guild => { client.channels.get('log kanal id').send(`${guild}, isimli sunucuya eklendim!`)})
// atıldım
client.on('guildRemove', async guild => { client.channels.get('log kanal id').send(`${guild}, isimli sunucudan atıldım.. :(`)})

client.on("roleDelete", async role => {
  let kanal = await db.fetch(`rolk_${role.guild.id}`);
  if (!kanal) return;
  const entry = await role.guild
    .fetchAuditLogs({ type: "ROLE_DELETE" })
    .then(audit => audit.entries.first());
  if (entry.executor.id == client.user.id) return;
  if (entry.executor.id == role.guild.owner.id) return;
  if(!entry.executor.hasPermission('ROLE_DELETE')) {
      role.guild.roles.create({
    name: role.name,
    color: role.hexColor,
    permissions: role.permissions
  });
   let emran = new Discord.MessageEmbed()
   .setColor('0x36393E')
   .setTitle(`Bir rol silindi !`)
   .setDescription(`Silinen rol adı ${role.name}, Rol koruma sistemi açık olduğu için rol geri oluşturuldu!`)
   client.channels.cache.get(kanal).send(emran)
  }
});
client.on('guildMemberAdd', member => {
  let kanal = db.fetch(`güvenlik.${member.guild.id}`)
  if(!kanal) return;

    let aylar = {
            "01": "Ocak",
            "02": "Şubat",
            "03": "Mart",
            "04": "Nisan",
            "05": "Mayıs",
            "06": "Haziran",
            "07": "Temmuz",
            "08": "Ağustos",
            "09": "Eylül",
            "10": "Ekim",
            "11": "Kasım",
            "12": "Aralık"
 }

let bitiş = member.user.createdAt
   let günü = moment(new Date(bitiş).toISOString()).format('DD')
   let ayı = moment(new Date(bitiş).toISOString()).format('MM').replace("01", "Ocak").replace("02","Şubat").replace("03","Mart").replace("04", "Nisan").replace("05", "Mayıs").replace("06", "Haziran").replace("07", "Temmuz").replace("08", "Ağustos").replace("09", "Eylül").replace("10","Ekim").replace("11","Kasım").replace("12","Aralık").replace("13","CodAre")//codare
  let yılı =  moment(new Date(bitiş).toISOString()).format('YYYY')
  let saati = moment(new Date(bitiş).toISOString()).format('HH:mm')

let günay = `${günü} ${ayı} ${yılı} ${saati}`  

   let süre = member.user.createdAt
   let gün = moment(new Date(süre).toISOString()).format('DD')
   let hafta = moment(new Date(süre).toISOString()).format('WW')
   let ay = moment(new Date(süre).toISOString()).format('MM')
   let ayy = moment(new Date(süre).toISOString()).format('MM')
   let yıl =  moment(new Date(süre).toISOString()).format('YYYY')
  let yıl2 = moment(new Date().toISOString()).format('YYYY')

  let netyıl = yıl2 - yıl

  let created = ` ${netyıl} yıl  ${ay} ay ${hafta} hafta ${gün} gün önce`

  let kontrol;
  if(süre < 1296000000) kontrol = 'Bu hesap şüpheli!'
  if(süre > 1296000000) kontrol = 'Bu hesap güvenli!'

  let codare = new Discord.MessageEmbed()
  .setColor('GREEN')
  .setTitle(`${member.user.username} Katıldı`)
  .setDescription('<@'+member.id+'> Bilgileri : \n\n  Hesap oluşturulma tarihi **[' + created + ']** (`' + günay + '`) \n\n Hesap durumu : **' + kontrol + '**')//codare
  .setTimestamp()
  client.channels.cache.get(kanal).send(codare)
})
client.on('guildMemberAdd', async member => {
  await member.roles.add(`810798681031966730`) //id yazan yere verilecek rol (unregistered)
  await member.setNickname(`♅ İsim | Yaş`) //yeni gelen kullanıcının adını değiştirme
let member2 = member.user 
let zaman = new Date().getTime() - member2.createdAt.getTime()
var user = member2 
var takizaman = [];
if(zaman < 604800000) {
takizaman = 'Tehlikeli bilader, a desen seni bıçaklar'
} else {
takizaman = `Güvenli, gizli sırrımızı öğrenebilir`}require("moment-duration-format");
 let zaman1 = new Date().getTime() - user.createdAt.getTime()
 const gecen = moment.duration(zaman1).format(` YY **[Yıl,]** DD **[Gün,]** HH **[Saat,]** mm **[Dakika,]** ss **[Saniye]**`) 
 let dbayarfalanfilan = await db.fetch(`takidbayar${member.guild.id}`)
 let message = member.guild.channels.cache.find(x => x.id === `810771549674143769`) //id yazan kısma kanal id'si [orn: register-chat]
  const taki = new Discord.MessageEmbed()
 .setTitle(
     "WELCOME TO GÖBAEF"
   )
   .setDescription(`Sunucumuza Hoş geldin ${member} 
Seninle Beraber **${message.guild.memberCount}** Kişiyiz.
Kaydının Yapılması İçin Sesli Odaya Geçerek Ses Vermen Gerekli.
<@&810771549208576028> Rolündeki Yetkililer Seninle İlgilenecektir.
Vermell Sınırsız Davet Link'i: 'discord.gg/KrfRuMA'

Hesap Açılalı: **${gecen}** Olmuş.
Bu Kullanıcı: **${takizaman}**
`)
.setColor('PURPLE')
message.send(taki)
 
         });
         client.on('guildMemberAdd', async (member, guild, message) => {
 
          let role = db.fetch(`otorolisim_${member.guild.id}`)
           let otorol = db.fetch(`autoRole_${member.guild.id}`)
           let i = db.fetch(`otorolKanal_${member.guild.id}`)
           if (!otorol || otorol.toLowerCase() === 'yok') return;
          else {
           try {
           
           
            if (!i) return
          if (!role) {
            member.roles.add(member.guild.roles.cache.get(otorol))
                                  var embed = new Discord.MessageEmbed()
                                  .setDescription("**Sunucuya Yeni Katılan** @" + member.user.tag + " **Kullanıcısına** <@&" + otorol + ">  **Rolü verildi.**")
                                  .setColor('0x36393E')
                                  .setFooter(`Otorol Sistemi`)
               member.guild.channels.cache.get(i).send(embed)
          } else if (role) {
              member.roles.add(member.guild.roles.cache.get(otorol))
                                  var embed = new Discord.MessageEmbed()
                                  .setDescription(`**Sunucuya Yeni Katılan** \`${member.user.tag}\` **Kullanıcısına** \`${role}\` **Rolü verildi.**`)
                                  .setColor('0x36393E')
                                  .setFooter(`Otorol Sistemi`)
               member.guild.channels.cache.get(i).send(embed)
           
          }
           
           } catch (e) {
           console.log(e)
          }
          }
           
          });
         
 
var regToken = /[\w\d]{24}\.[\w\d]{6}\.[\w\d-_]{27}/g;

client.on('warn', e => {
  console.log(chalk.bgYellow(e.replace(regToken, 'that was redacted')));
});

client.on('error', e => {
  console.log(chalk.bgRed(e.replace(regToken, 'that was redacted')));
});

client.login(ayarlar.token);
