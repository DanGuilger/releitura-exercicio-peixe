var config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,

    physics: { 
        default: 'arcade',
        arcade: {
            debug: false 
        }
    },

    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

var game = new Phaser.Game(config);

var peixinhoContainer;
var peixinho;
var fogo;
var blasters;
var asteroides;
var score = 0;
var scoreText;
var targetX = 400, targetY = 300; // Posição alvo do mouse

function preload() {
    this.load.image('mar', 'assets/FUNDO.png');

    // Carregar logo
    this.load.image('logo', 'assets/LOGO.png');

    // Carregar nave (X-Wing)
    this.load.image('peixe', 'assets/peixes/X.png');

    this.load.image('fogo', 'assets/fogo.png');

    this.load.image('morte', 'assets/estreladamorte.png');

    this.load.image('blaster', 'assets/blaster.png'); 

    this.load.image('asteroide', 'assets/asteroide.png');

    this.load.image('explosao', 'assets/explosao.png');

    this.load.image('sabre', 'assets/sabre.png');
}

function create() {
    this.add.image(960, 540, 'mar').setScale(2); // Fundo

    // Adicionar a logo na tela
    this.add.image(200, 200, 'logo').setScale(0.4);

    // Criar um contêiner para a nave
    peixinhoContainer = this.add.container(960, 540); // Centro da tela

    // Adicionar a nave dentro do contêiner
    peixinho = this.add.image(0, 0, 'peixe').setScale(0.3); 

    this.add.image(1720, 880, 'morte').setScale(0.5)
    
    // Posição (0,0) dentro do contêiner
    peixinhoContainer.add(peixinho);

    // Criar animação de voo sutil (afeta apenas a imagem, não o contêiner)
    this.tweens.add({
        targets: peixinho,
        y: '+=10', // Move 10 pixels para baixo dentro do contêiner
        duration: 1000, // Tempo da animação (1 segundo)
        yoyo: true, // Faz o movimento de volta (pra cima)
        repeat: -1, // Repetir infinitamente
        ease: 'Sine.easeInOut' // Movimento suave
    });

    // Event listener para pegar a posição do mouse
    this.input.on('pointermove', function (pointer) {
        targetX = pointer.x;
        targetY = pointer.y;
    });

    // Criar o fogo e posicionar atrás da nave
    fogo = this.add.image(peixinhoContainer.x - 120, peixinhoContainer.y, 'fogo').setScale(0.5).setAlpha(0);

    // Criar um tween para o efeito de aparecimento e desaparecimento do fogo
    this.tweens.add({
        targets: fogo,
        alpha: { from: 1, to: 0 }, // O fogo aparece e desaparece
        duration: 50, // Tempo de duração do fogo
        repeat: -1, // Repetir infinitamente
        yoyo: true, // Faz o efeito de fade in e fade out

});

    // Criar um grupo para armazenar os blasters COM FÍSICA
    blasters = this.physics.add.group({
        defaultKey: 'blaster',
        maxSize: 100, // Limite de 10 tiros ativos
        runChildUpdate: true
});


this.time.addEvent({
    delay: 200, // Intervalo entre tiros (200ms)
    callback: function() {
        var blaster = blasters.get(peixinhoContainer.x + 50, peixinhoContainer.y, 'blaster');

        if (blaster) {
            blaster.setActive(true);
            blaster.setVisible(true);
            blaster.setScale(0.2);
            blaster.setVelocityX(800); // Define a velocidade para a direita
        }

        this.time.delayedCall(2000, function() {
            if (blaster && blaster.x > this.sys.game.config.width + 50) {
                blaster.destroy();
            }
        }, [], this);
    },
    callbackScope: this,
    loop: true
});


    asteroides = this.physics.add.group();

    this.time.addEvent({
        delay: Phaser.Math.Between(1000, 3000), // Tempo aleatório entre 1s e 3s
        callback: function() {
            var yPos = Phaser.Math.Between(50, this.sys.game.config.height - 50);
            var asteroide = asteroides.create(this.sys.game.config.width + 50, yPos, 'asteroide').setScale(0.4);
    
            if (asteroide) {
                asteroide.setVelocityX(-Phaser.Math.Between(200, 500)); // Movimento para a esquerda
                asteroide.setAngularVelocity(Phaser.Math.Between(-50, 50)); // Rotação aleatória
                asteroide.body.allowGravity = false; 
            }
    
            this.time.delayedCall(7000, function() {
                if (asteroide && asteroide.x < -50) {
                    asteroide.destroy();
                }
            }, [], this);
        },
        callbackScope: this,
        loop: true
    });    
    

    this.physics.add.overlap(blasters, asteroides, destruirAsteroide, null, this);

    scoreText = this.add.text(1525, 160, 'SCORE: 0', { 
        fontSize: '64px', 
        fill: '#FFF82A',
        fontFamily: 'Death Star'
    });    

}

function update() {
    // Agora movemos o contêiner (não a nave diretamente)
    peixinhoContainer.x += (targetX - peixinhoContainer.x) * 0.1; // Suaviza o movimento horizontal
    peixinhoContainer.y += (targetY - peixinhoContainer.y) * 0.1; // Suaviza o movimento vertical

    // Atualizar a posição do fogo para sempre ficar atrás da nave
    fogo.x = peixinhoContainer.x - 120;
    fogo.y = peixinhoContainer.y;

    // Atualizar a posição do fogo para acompanhar o balanço da nave
    fogo.x = peixinhoContainer.x - 120; // Mantém atrás da nave
    fogo.y = peixinhoContainer.y + peixinho.y - 25; // Adiciona o balanço

}

function destruirAsteroide(blaster, asteroide) {
    if (blaster && blaster.active) {
        blaster.destroy(); // Remove o blaster ao colidir
    }
    if (asteroide && asteroide.active) {
        // Criar a explosão no local do asteroide
        var explosao = this.add.image(asteroide.x, asteroide.y, 'explosao').setScale(0.1).setAlpha(1);

        // Criar a animação de crescimento e desaparecimento da explosão
        this.tweens.add({
            targets: explosao,
            scale: { from: 0.1, to: 1.5 }, // Cresce de 10% para 150%
            alpha: { from: 1, to: 0 }, // Diminui a opacidade para desaparecer
            duration: 500, // Duração total da animação (0.5s)
            ease: 'Linear',
            onComplete: function() {
                explosao.destroy(); // Remove a explosão após a animação
            }
        });

        asteroide.destroy(); // Remove o asteroide após criar a explosão

        score += 100;
        scoreText.setText('Score: ' + score);
    }
}