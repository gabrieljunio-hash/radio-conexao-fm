-- Lote 06: 35 vínculos.
INSERT OR IGNORE INTO station_categories (station_id, category_id)
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='mpb' WHERE s.slug='rb-7ada8a815ae1418c8f1851d2f38d86a4'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='jazz-blues' WHERE s.slug='rb-ef07dbb211764b09bb879e841300c3cf'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-3998f9aeed80431981090acb29efb256'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='gospel' WHERE s.slug='rb-12c347103f544834b9c460b7deebf888'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='jazz-blues' WHERE s.slug='rb-9f0466beb6b04f7cbafff64555494804'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-2eb416591b7c43e59b9836634086a73c'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='jazz-blues' WHERE s.slug='rb-c7d6315c3bcd40f6a1b54bc1c8efecee'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-1eaf681041de4a43827bdcf8070748e5'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-b89996920fba46608934c74167efc9e0'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-29ca713647474dcf92db69ad65e2182b'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='regional' WHERE s.slug='rb-4317dca39e67422682a88f650ba50219'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-cef8689aa8584400aaaff6e57a633836'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-13dea9bde0f04bd6b5f1f56ed8a91f45'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-345cc08ca5e343d995430626f2081177'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='gospel' WHERE s.slug='rb-1a19841930834cd0a8fe42fef3f488e1'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-ce5aac6ce4994714a28ba1a94baa1b74'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-bf97c7e7a9604ddc88320def9e6d603f'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-f7ff2097abdc4187b2b172308efc711c'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-f0ef57027eae47518049484ff571a4df'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='noticias' WHERE s.slug='rb-9c16f0b1776442648d3368f3566c68ef'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='noticias' WHERE s.slug='rb-bae11a44825748969a0f7077ff899d23'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-69b884ff8b524d18a3d15e6b52b5864a'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-2ca712c42d5f4dbda2e31961136eec4e'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-ca7d9a61eb2849bc99ba5a140869919c'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='noticias' WHERE s.slug='rb-91b43e8e5a0545b6a43ef2a9b739efea'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-abd1417010774330b0a691a2f389310d'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='brega' WHERE s.slug='rb-6662367554874432a032c4dc510b73b8'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-7243de27598a4d888028533da5a20d40'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-982497ba0b8045979ea0f9789ea6d5ef'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='flashback' WHERE s.slug='rb-55c4c15a9885446c94b03ac4e71123f6'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='sertanejo' WHERE s.slug='rb-45b2f3d4b18842aebb8cd57e95d652ce'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='noticias' WHERE s.slug='rb-fd792bab3d5543969c5d81e122eb5edd'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='brega' WHERE s.slug='rb-c69b53f20b2b4f9f9e685b84b499f06a'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='rock' WHERE s.slug='rb-77c0088f9ae74bd3a1deedfc17f5ce86'
UNION ALL
SELECT s.id, c.id FROM stations s JOIN categories c ON c.slug='pop' WHERE s.slug='rb-72e626b2aba64afa933fa6c5a61f16b6';
