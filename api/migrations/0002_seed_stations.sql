-- Execute primeiro o BLOCO 1 e depois o BLOCO 2, separadamente, no Console D1.
-- São somente duas instruções SQL, para evitar a execução parcial do arquivo.

-- Cadastro inicial em um único INSERT (pode executar novamente sem duplicar).
INSERT OR IGNORE INTO stations (slug,name,stream_url,logo_url,country_code,city,language,description,is_active,is_verified)
VALUES
('radio-antena-1-94-7-fm-570cc99a','Rádio Antena 1 94.7 FM','https://antenaone.crossradio.com.br/stream/1;','https://img.radios.com.br/radio/lg/radio9505_1574106966.jpg','BR','Sao Paulo','pt-BR','adult, flashback',1,0),
('radio-mix-106-3-fm-901c92bd','Rádio Mix 106.3 FM','https://playerservices.streamtheworld.com/api/livestream-redirect/MIXFM_SAOPAULOAAC.aac','https://img.radios.com.br/radio/lg/radio13955_1720711597.png','BR','Sao Paulo','pt-BR','chr, pop-rock',1,0),
('alpha-fm-101-7-mhz-sao-paulo-sp-447a1a5f','Alpha FM 101.7 MHz (São Paulo - SP)','https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_ALPHAFM_ADP.aac','https://cdn-profiles.tunein.com/s8129/images/logod.jpg','BR','São Paulo','pt-BR','light, misc',1,0),
('radio-jovem-pan-100-9-fm-8e9b5ba4','Rádio Jovem Pan 100.9 FM','https://stream.zeno.fm/c45wbq2us3buv','https://img.radios.com.br/radio/lg/radio8829_1708517690.png','BR','Sao Paulo','pt-BR','entertainment, journalism',1,0),
('radio-saudade-fm-99-7-5dcbb03d','Rádio Saudade FM 99.7','https://playerservices.streamtheworld.com/api/livestream-redirect/SAUDADE_FMAAC.aac','https://img.radios.com.br/radio/lg/radio8_1626274312.png','BR','Santos, Sao Paulo (Brazil)','pt-BR','adult, classic hits',1,0),
('89-a-radio-rock-65908a60','89 A Radio Rock','https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_89FM_ADP.aac?dist=site-89fm',NULL,'BR','São Paulo','pt-BR','alternative rock, rock',1,0),
('super-radio-tupi-96-5-84a51775','Super Radio Tupi 96.5','https://8923.brasilstream.com.br/stream',NULL,'BR','Rio de Janeiro','pt-BR','local news, news talk',1,0),
('cbn-sao-paulo-52994d67','CBN São Paulo','https://playerservices.streamtheworld.com/api/livestream-redirect/CBN_SPAAC.aac',NULL,'BR','Sao Paulo','pt-BR','news, sports',1,0),
('sertaneja-106-7-00bc4f1d','Sertaneja 106.7','https://sc4s.cdn.upx.com:8067/stream','https://assets.clubefm.com.br/uploads/site/logo/2/106-sertaneja-4fff3e1f118ab621432fa4d74136e042e86b6eedbabf561ded0dfd61123d980e.png','BR','São Paulo','pt-BR','country, sertanejo',1,0),
('bandnews-fm-b3a2b935','BandNews FM','https://playerservices.streamtheworld.com/api/livestream-redirect/BANDNEWSFM_SPAAC_SC','https://static.mytuner.mobi/media/tvos_radios/YjB73sNAHd.png','BR','Sao Paulo','pt-BR','news, sports',1,0),
('kiss-fm-92-5-sao-paulo-f0d81ba6','Kiss FM - 92.5 - São Paulo','https://26593.live.streamtheworld.com/RADIO_KISSFM_ADP.aac',NULL,'BR','São Paulo','pt-BR','rock',1,0),
('80-hits-brasil-4c66701a','80 Hits Brasil','https://stm5.painelcast.com:7662/stream','https://i.ibb.co/5x1yHdR0/LOGO2025.png','BR','DF','pt-BR','80''s, 80s',1,0),
('radio-itatiaia-95-7-fm-f66f08c3','Rádio Itatiaia 95.7 FM','https://8903.brasilstream.com.br/stream','https://img.radios.com.br/radio/lg/radio14_1646746883.jpeg','BR','Minas Gerais','pt-BR','news, soccer',1,0),
('br-the-classic-rock-195f2990','BR - The Classic Rock','https://stream.zeno.fm/nbq1aq62gd0uv','https://cdn.onlineradiobox.com/img/l/5/94775.v6.png','BR','Minas Gerais','pt-BR','classic rock, hard rock',1,0),
('jovem-pan-fm-florianopolis-sc-bf64595a','Jovem Pan FM - Florianópolis - SC','https://live.paineldj.com.br/proxy/jfloripa?mp=/stream','https://jpimg.com.br/uploads/2024/02/avatar-florianopolis-rgb-500x500.png','BR','Santa Catarina','pt-BR','chr, contemporary hits radio',1,0),
('radio-cidade-rio-de-janeiro-102-9-fm-zyd462-06da0d92','Rádio Cidade - Rio de Janeiro - 102.9 FM - ZYD462','https://playerservices.streamtheworld.com/api/livestream-redirect/RADIOCIDADEAAC.aac',NULL,'BR','Rio de Janeiro','pt-BR','brazilian rock, classic rock',1,0),
('jovem-pan-news-c7f6caca','Jovem Pan News','https://stream.zeno.fm/vlcraijc6yiuv',NULL,'BR','São Paulo (SP)','pt-BR','news, sports',1,0),
('radio-studio-flashback-c064c241','Rádio Studio Flashback','https://stream-163.zeno.fm/6gv76f1xruquv?zs=SvdWy-tsTtCXPZ9IZC0ASA','https://pbs.twimg.com/media/GE7jNgZWQAEcxNb?format=png&name=240x240','BR','Minas Gerais','pt-BR','00''s, 00s',1,0),
('ouro-verde-fm-easy-105-5-6116adf7','Ouro Verde FM Easy 105.5','https://8522.brasilstream.com.br/stream','https://ouroverdefm.com.br/wp-content/uploads/2022/11/favicon-150x150.png','BR','Parana','pt-BR','brasil, brazilian music',1,0),
('kiss-fm-sao-paulo-d12439b1','Kiss FM São Paulo','https://playerservices.streamtheworld.com/api/livestream-redirect/RADIO_KISSFMAAC.aac?1655609055880',NULL,'BR','Sao Paulo (Brazil)','pt-BR','Rádio online',1,0),
('radio-transamerica-100-1-fm-6da066a5','Rádio Transamérica 100.1 FM','https://playerservices.streamtheworld.com/api/livestream-redirect/RT_SPAAC.aac','https://img.radios.com.br/radio/lg/radio8803_1578516680.png','BR','Sao Paulo','pt-BR','adult, soccer',1,0),
('jovem-pan-fm-belo-horizonte-mg-99-1-mhz-d4f0f5ca','Jovem Pan FM - Belo Horizonte - MG - 99.1 Mhz','https://8062.brasilstream.com.br/stream?origem=task_site',NULL,'BR','Minas Gerais','pt-BR','Rádio online',1,0),
('radio-energia-97-fm-247e4d32','Radio Energia 97 FM','https://streaming.inweb.com.br/energia',NULL,'BR','Sao Paulo (Brazil)','pt-BR','esportes futebol, futebol',1,0),
('radio-cidade-maracaju-104-3-fm-35ac4203','Rádio Cidade Maracaju 104.3 FM','https://servidor33-5.brlogic.com:7078/live','https://public-rf-upload.minhawebradio.net/250444/logo/c9f6c0e472e2023c1d2cf8744f78a973.png','BR','Mato Grosso do Sul','pt-BR','chamame, ecletic',1,0);

-- Associação das rádios às categorias em um único INSERT.
WITH seed(slug, category_slug) AS (
  VALUES
    ('radio-antena-1-94-7-fm-570cc99a','flashback'),
    ('radio-mix-106-3-fm-901c92bd','rock'),
    ('alpha-fm-101-7-mhz-sao-paulo-sp-447a1a5f','pop'),
    ('radio-jovem-pan-100-9-fm-8e9b5ba4','pop'),
    ('radio-saudade-fm-99-7-5dcbb03d','flashback'),
    ('89-a-radio-rock-65908a60','rock'),
    ('super-radio-tupi-96-5-84a51775','noticias'),
    ('cbn-sao-paulo-52994d67','noticias'),
    ('sertaneja-106-7-00bc4f1d','sertanejo'),
    ('bandnews-fm-b3a2b935','noticias'),
    ('kiss-fm-92-5-sao-paulo-f0d81ba6','rock'),
    ('80-hits-brasil-4c66701a','flashback'),
    ('radio-itatiaia-95-7-fm-f66f08c3','noticias'),
    ('br-the-classic-rock-195f2990','flashback'),
    ('jovem-pan-fm-florianopolis-sc-bf64595a','rock'),
    ('radio-cidade-rio-de-janeiro-102-9-fm-zyd462-06da0d92','flashback'),
    ('jovem-pan-news-c7f6caca','noticias'),
    ('radio-studio-flashback-c064c241','flashback'),
    ('ouro-verde-fm-easy-105-5-6116adf7','flashback'),
    ('kiss-fm-sao-paulo-d12439b1','pop'),
    ('radio-transamerica-100-1-fm-6da066a5','pop'),
    ('jovem-pan-fm-belo-horizonte-mg-99-1-mhz-d4f0f5ca','pop'),
    ('radio-energia-97-fm-247e4d32','noticias'),
    ('radio-cidade-maracaju-104-3-fm-35ac4203','sertanejo')
)
INSERT OR IGNORE INTO station_categories (station_id, category_id)
SELECT s.id, c.id
FROM seed
JOIN stations s ON s.slug = seed.slug
JOIN categories c ON c.slug = seed.category_slug;
