-- Lote 08: 35 vínculos de categoria.
INSERT OR IGNORE INTO station_categories (station_id, category_id)
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-737269d6fa3e493ca5cc883df75a327e'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-9d4cc69bbb8341c3b76c9da2eacee424'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-4c51a2e0b7b545bdba546ec2ec9743f4'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-f927b6f0a04145059cdd3da91ff12ecc'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='mpb' WHERE s.slug='rb-5469196d3ed842289d445dac3c6144f2'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-0617d31ed2104b3097636cf87104ca2f'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-31d064a754524f7d8d781f5784778f20'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='eletronica' WHERE s.slug='rb-475aef6045f348ce8e6ea9f0a0212cdc'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-4a7680b2f3da4454b80dba739f267431'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-75d4a04757f64717bb36600c9f2d1ac3'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-a49ae0e2978d4a50a43b150693abb00f'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='mpb' WHERE s.slug='rb-13e3e176b32a49d286e39869dc5baab6'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-760d9e3657aa4a75a37344d10400e4d7'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-67ad22a5c2bb4d40943ab39094fd7445'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-afe8b858c5bf40b8b27002e4cac71abb'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='mpb' WHERE s.slug='rb-a5f3e93450d3470aba18a9bb29070b23'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='regional' WHERE s.slug='rb-1711620ab6bd4b9bbc07297e0f0649d7'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-8ee67b0d757c4adc83db5ab5e26ba2b7'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-3b097aaa6f7b44bfb9d417990a5603a7'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-1396520b9c834a79ba2e599e6d7a37a8'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-87325c87179149b68b7827cf4b4413af'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-26ae703216594ceaae090a30606a276e'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-3053d91b7c524222a74584467511d19c'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-e82b1aa7bfd14208bfd6f9c5ab541b20'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-4e265a9e1f744269b5505510a56920f6'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-bb6ba0d5294b46e2ba53822d26655b8d'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-5472237ef2e241ebb783a3f63b225ffe'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-8eb049c1ff574c44856cd6355b56ec56'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='brega' WHERE s.slug='rb-b3a7491fe14e4c1e83c2f404e084207b'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-cb42eaf3a1294e5686ec5ccfa7cf195f'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-9d6afaccb39f44d9ab4c3d76b520229c'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-d1f5394d984f42449461da318d026dd8'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='mpb' WHERE s.slug='rb-2eee3e725fe3444c9be272f7a6c7477d'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-be7c6ab1509245dda0880232c7dc30da'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-d4b4155ca2a74a3ab9469eedc4c6231d';
