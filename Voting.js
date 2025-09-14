
const ctx = document.getElementById('myChart');

const chart = new Chart(ctx, {
    type: 'pie',
    data: {
        labels: ['社会不適合党','アロエイズム','踊る阿呆党', '甘党',],
        datasets: [{
            label: '# of Votes',
            data: [60, 19, 13, 9,],
            backgroundColor: [
				'rgba(153, 102, 255, 0.5)',
                'rgba(255, 99, 132, 0.5)',
                'rgba(54, 162, 235, 0.5)',
                'rgba(255, 206, 86, 0.5)',
                
            ],
            borderColor: [
				'rgba(153, 102, 255, 1)',
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
            ],
            borderWidth: 1,
         }
		]
}
,
options:{ 
  legend: {
	position:"right",
	labels: {
		fontColor:"White",
	}
}
}
}
)
