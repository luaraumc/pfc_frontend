// Exemplo de requisição para listar itens
fetch("http://localhost:5000/itens")
  .then(res => res.json())
  .then(data => {
    // Exibir itens na página
    console.log(data);
  });

// Exemplo para criar item
fetch("http://localhost:5000/itens", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nome: "Novo", descricao: "Descrição" })
})
  .then(res => res.json())
  .then(data => {
    alert("Item criado com id: " + data.id);
  });