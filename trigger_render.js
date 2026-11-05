async function triggerRender() {
  const serviceId = 'srv-dblmf4o8v5cc739ibctg';
  const apiKey = 'rnd_nx8wDc5zniAL9nVyAKp45rsNf9Nk';
  const res = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ clearCache: 'do_not_clear' })
  });
  console.log('Render deploy trigger HTTP status:', res.status);
  const data = await res.json();
  console.log('Render Deploy response:', data);
}

triggerRender().catch(console.error);
