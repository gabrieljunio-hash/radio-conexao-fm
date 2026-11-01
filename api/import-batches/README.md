# Importação manual D1 em lotes

O Console D1 estava rejeitando o arquivo único de 41 KB. Estes arquivos dividem a mesma importação em statements menores.

Execute na ordem, um arquivo por vez, no banco `radio-conexao-db`:
1. `00-categories.sql`
2. `01-stations.sql` até `05-stations.sql`
3. `06-categories-links.sql` e `07-categories-links.sql`

Todos os comandos usam `INSERT OR IGNORE`, então podem ser repetidos sem duplicar rádios ou vínculos. Não execute a migration antiga junto com estes lotes.

Ao terminar, valide com:

```sql
SELECT
  (SELECT COUNT(*) FROM stations) AS radios,
  (SELECT COUNT(*) FROM stations WHERE slug LIKE 'rb-%') AS radios_importadas,
  (SELECT COUNT(*) FROM categories) AS categorias,
  (SELECT COUNT(*) FROM station_categories) AS vinculos;
```

Resultado esperado considerando as 24 rádios iniciais: 165 rádios, 141 importadas, 17 categorias e pelo menos 140 vínculos.
