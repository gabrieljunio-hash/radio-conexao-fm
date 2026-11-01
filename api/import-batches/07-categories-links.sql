-- Lote 07: 35 vínculos de categoria.
INSERT OR IGNORE INTO station_categories (station_id, category_id)
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='eletronica' WHERE s.slug='rb-55594c6ebd3d42acab88edc155ba303f'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-7e1c7041c2884f9ab8591a461cf728dc'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-b0d6222c8bf84fe98666e4b66f7a9057'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='regional' WHERE s.slug='rb-0c7b22e4b2624f9880e7e4bdc097cc35'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-09d32090d71841688720ea4517e3481e'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-2e08b24350134667a388ec08c2ef70aa'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-a06df63571d247a584625393b7ba070a'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='regional' WHERE s.slug='rb-aa5e31a40c7b480c86d3ba33a1bfe178'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-59b79175852445adba89bb6c16d7e2c0'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-3c835bae67a248d1adf6c1d967ad3d31'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-2c3bf58ffd124e93bcde4d7f1899faf1'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-ed02a49b11e24de3b279279529290257'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='regional' WHERE s.slug='rb-6a8fa132f23441b1816076405b2ddf22'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-8425dde9066d4686b2fa82d87ecd3ddf'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-fc33f2de34af49858780a5536b228c00'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-a24e7acf71f2478e8d3361201a901eea'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-7f1cf5bbbbea4d51b98d9b024d595043'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-4cb94b99ff064521b643a78bf272dbe3'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='noticias' WHERE s.slug='rb-87b54a59a332497aa0522eca1dd4f78f'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='noticias' WHERE s.slug='rb-99a8db21bde44f3aa7aea0e3553a7ced'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-7c1cc8366e474675beb4ee8ca29f04e0'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-bdae6342983a485688cd31b317c69b62'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-b75c874c1f894bf2993be30807657afe'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-03beadd2ce1d4949bab40dcce1894412'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-1aae22543d6143abb9b1d62f20619b05'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-d0b93f19cd1e4d4699b3206439e8062c'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-030efc7c8bd04fd29b52e5d4e5d72f96'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-979ab633fbc44af49d1498a5200fdd2e'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-b6d2dba2acfd4addab3a085527279f2e'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='gospel' WHERE s.slug='rb-5839c451da02421ab2708932b162f627'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-456dae04eaee4dc3bb8c038412e24d04'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='brega' WHERE s.slug='rb-9bef4f1aac824f7f98a43fd3dcceef63'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-ab7648814afe443695821339fe0357ef'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-334768d538df4e20bd97285acfaec937'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-f34d64aab0a84551b65f9bbf4b765b9b';
