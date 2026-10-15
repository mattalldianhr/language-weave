"""Hand-written grammar-word lists per language.

HEURISTIC. These are small hand lists written by the model, not POS-tagged
data. Categories flagged as "grammar": articles, pronouns (personal,
possessive, demonstrative, relative, interrogative), auxiliaries/copulas
(be/have/do and their equivalents), prepositions and their contractions,
conjunctions, negation particles, and for ja/zh the case/aspect particles
and classifiers. Modals, quantifiers, and adverbs are left as "content"
because they are swappable (very -> muy, always -> siempre).
Digits are flagged "number".
"""

from __future__ import annotations

from common import EN_GRAMMAR_BROAD

GRAMMAR: dict[str, set[str]] = {}

GRAMMAR["en"] = set(EN_GRAMMAR_BROAD)

GRAMMAR["es"] = set(
    """
    el la los las un una unos unas lo al del
    yo tú él ella nosotros nosotras vosotros vosotras ellos ellas usted ustedes
    me te se nos os le les mi mis tu tus su sus nuestro nuestra nuestros
    nuestras vuestro vuestra este esta esto estos estas ese esa eso esos esas
    aquel aquella aquello aquellos aquellas que quien quienes cual cuales
    qué quién quiénes cuál cuáles mí ti sí mío mía tuyo tuya suyo suya
    a de en con por para sin sobre entre hasta desde hacia según tras contra
    ante bajo durante mediante
    y e o u pero sino ni porque aunque si cuando como mientras donde pues
    cómo dónde cuándo
    es son era eran fue fueron ser soy eres somos sois sea sean será serán
    sería sido siendo está están estaba estaban estoy estás estamos estar
    estado estuvo ha han he has hemos había habían hay haber habrá hubo
    no
    """.split()
)

GRAMMAR["fr"] = set(
    """
    le la les l l' un une des du de d d' au aux
    je tu il elle on nous vous ils elles me te se m m' t t' s s' j j'
    lui leur y en moi toi soi eux ce c c' ça cela ceci celui celle ceux celles
    mon ma mes ton ta tes son sa ses notre nos votre vos leurs
    qui que qu qu' quoi dont où lequel laquelle lesquels lesquelles quel
    quelle quels quelles cet cette ces
    à dans sur sous avec sans pour par entre vers chez contre depuis pendant
    avant après devant derrière jusque jusqu jusqu'
    et ou mais donc or ni car si quand comme lorsque parce puisque
    est sont était étaient été être suis es sommes êtes sera seront serait
    soit ai as a avons avez ont avait avaient avoir eu aura aurait aie ait
    ne n n' pas non
    est-ce
    """.split()
)

GRAMMAR["de"] = set(
    """
    der die das des dem den ein eine einer eines einem einen
    ich du er sie es wir ihr mich dich sich uns euch mir dir ihm ihn ihnen
    mein meine meiner meinem meinen meines dein deine deiner deinem deinen
    sein seine seiner seinem seinen unser unsere unserer unserem unseren
    euer eure ihre ihrer ihrem ihren dieser diese dieses diesem diesen
    jener jene jenes wer wen wem wessen was welcher welche welches welchem
    welchen man jemand niemand etwas nichts
    in an auf für von mit zu bei nach aus über unter vor hinter neben
    zwischen durch gegen ohne um seit bis ab während wegen trotz
    im am zum zur vom ins ans beim
    und oder aber sondern denn dass daß weil wenn ob als wie obwohl damit
    bevor nachdem wo
    ist sind war waren bin bist seid gewesen wird werden wurde wurden werde
    wirst worden hat haben habe hast hatte hatten gehabt hab
    nicht kein keine keinen keiner keinem keines
    s
    """.split()
)

GRAMMAR["it"] = set(
    """
    il lo la i gli le l l' un uno una un' del dello della dei degli delle
    al allo alla ai agli alle dal dallo dalla dai dagli dalle nel nello nella
    nei negli nelle sul sullo sulla sui sugli sulle col coi
    io tu lui lei noi voi loro egli ella esso essa essi esse me te mi ti si
    ci vi ne li mio mia miei mie tuo tua tuoi tue suo sua suoi sue nostro
    nostra nostri nostre vostro vostra vostri vostre questo questa questi
    queste quello quella quelli quelle ciò che chi cui quale quali
    di a da in con su per tra fra ad
    e ed o od ma però perché se quando come mentre
    è sono era erano sei siamo siete essere stato stata stati state sarà
    saranno sarebbe sia siano ho hai ha abbiamo avete hanno aveva avevano
    avere avuto avrà avrebbe abbia
    non
    c c' d d'
    """.split()
)

GRAMMAR["pt"] = set(
    """
    o a os as um uma uns umas do da dos das no na nos nas ao à aos às
    dum duma num numa pelo pela pelos pelas
    eu tu ele ela nós vós eles elas você vocês me te se vos lhe lhes mim
    ti si meu minha meus minhas teu tua teus tuas seu sua seus suas nosso
    nossa nossos nossas este esta isto estes estas esse essa isso esses essas
    aquele aquela aquilo aqueles aquelas que quem qual quais cujo onde
    de em com por para sem sobre entre até desde contra sob ante após
    e ou mas porém porque quando como enquanto pois
    é são era eram foi foram ser sou és somos sois seja sejam será serão sido
    sendo está estão estava estavam estou estás estamos estar estado esteve
    tem têm tinha tinham ter tido há haver havia
    não
    """.split()
)

# wordfreq tokenizes Japanese with MeCab into morphemes, so inflection
# endings and particles appear as separate "words".
GRAMMAR["ja"] = set(
    """
    の に て は が を で と な も か から よ ね や へ ので ば まで より など とか
    って わ さ ぞ ぜ ん じゃ なら たら のに けど ながら
    だ です た ます まし ない なかっ なく ぬ れ れる られ られる せ させ う
    よう でしょ だろ だっ であり である ある あり あっ いる い し する てる
    こと もの ため という として
    私 僕 俺 あなた 君 彼 彼女 我々 自分 これ それ あれ この その あの
    どれ どの 何 誰 ここ そこ あそこ どこ
    お ご さん
    """.split()
)

# wordfreq tokenizes Chinese with jieba.
GRAMMAR["zh"] = set(
    """
    的 了 着 过 地 得 吗 吧 呢 啊 哦 之 所 被 把 将 并 及 与 和 跟 而 于 以
    对 从 到 给 向 往 在 为 由 比 除 关于 中 里 上 下 后 前
    我 你 他 她 它 我们 你们 他们 她们 它们 这 那 这个 那个 这些 那些 这里
    那里 自己 谁 什么 哪 哪个 哪里 怎么 怎样 这样 那样 这么 那么
    是 不是 有 没有 没
    或 或者 但 但是 而且 因为 所以 如果 虽然 然后 还是
    不 别
    个 一个 些 种
    """.split()
)


def classify(lang: str, word: str) -> str:
    """Return 'number', 'grammar', or 'content' (heuristic)."""
    w = word.lower()
    if w.isdigit():
        return "number"
    if w in GRAMMAR.get(lang, set()):
        return "grammar"
    if lang == "en":
        from common import en_is_grammar

        if en_is_grammar(w, broad=True):
            return "grammar"
    return "content"
