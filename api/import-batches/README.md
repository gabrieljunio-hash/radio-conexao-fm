# Importação manual D1 em lotes

Execute um arquivo por vez no banco `radio-conexao-db`, nesta ordem:
1. `00-categories.sql`
2. `01-stations.sql` até `05-stations.sql`
3. `06-categories-links.sql` até `09-categories-links.sql`

Não execute a migration antiga junto com estes lotes. Todos usam `INSERT OR IGNORE` e podem ser repetidos sem duplicar registros.

Valide ao final:
```sql
SELECT
 (SELECT COUNT(*) FROM stations) AS radios,
 (SELECT COUNT(*) FROM stations WHERE slug LIKE 'rb-%') AS radios_importadas,
 (SELECT COUNT(*) FROM categories) AS categorias,
 (SELECT COUNT(*) FROM station_categories) AS vinculos;
```
Esperado partindo do banco original: 165 rádios, 141 importadas, 17 categorias e 140 vínculos importados.
