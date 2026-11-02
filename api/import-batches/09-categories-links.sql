-- Lote 09: 35 vínculos.
INSERT OR IGNORE INTO station_categories (station_id, category_id)
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-d6a10f145c0448a58b805d22a479e550'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='mpb' WHERE s.slug='rb-23477ac267744dd0822ea2ae0d9f24d1'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-a8e3f6894c8a4e6cbe47f611871965b0'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-102ec59e37844013a759c53fa4cf085a'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-394dee39b4f54888bdbf18355baa4d70'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-60633a5998ab4372a33db7f83513de0c'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-df98c5cd6b254381950bd15753439b97'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-a72e7bd372a5462f8bcdedeeb60fb063'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='regional' WHERE s.slug='rb-bdf9c69cd8584e73b1721a91bcaeb878'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-6c6187ff486647d0a34038967e9dc237'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-712091dc0bab44e6b2f4487681022d8a'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-21da2b7f5e8147ebbb78a620dc135215'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-c04baa7cce6f4d0f94ba9c50131da232'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='regional' WHERE s.slug='rb-f39f6d0ea5344d219352e35e3bdddd48'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-2442fea964ca4a6da9428abfd7cb42f5'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-bc97d762e99644da93f65769cadd2059'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-388119560e6646599aebec57af5f4b2c'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-d2678e94cc54457abef42fc355ec4199'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-222996bb426b47eaa3dd1a5dbab66e94'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-b30a485502c04fbf95dbfde57d0fc06a'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='noticias' WHERE s.slug='rb-2d5168a37e43483c95229d0989ddc3a8'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-9bd724224f0a40069bc810fa7bf80f2e'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='mpb' WHERE s.slug='rb-82d7e115be834cfc93e63106e81146e1'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-86e9afc9e7bd486487ab58166e97662d'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-d4e2ea20500a4f8fa1ccc7b53698df18'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-2ecd468b523e4f358f5b251390b642f0'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-7b1ec735443e449aa9b0eb144f8deed9'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='eletronica' WHERE s.slug='rb-32d4ce82424c43c697e6e910b2976875'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-5dcde1018ff74750ba90125d6de2a666'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-7e18c18ddabe404c941d9ebe811ddd90'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-823e517b82e0447ca8ca2f6454e9d852'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='noticias' WHERE s.slug='rb-93ebaad127364389ae1a6013bea5f459'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-2227864807934eaa9d8577c87b93fbee'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-9f52a54e979642b1b4a579b389677bae'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-f13d5793d1d7446f803a2653c0518b8e';
