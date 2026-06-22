from PIL import Image, ImageDraw, ImageFont

W, H = 1440, 980
img = Image.new("RGB", (W, H), "#f6f8f7")
draw = ImageDraw.Draw(img)

def font(size, bold=False):
    names = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except Exception:
            pass
    return ImageFont.load_default()

f12, f14, f16, f18, f22, f30, f44 = [font(s) for s in (12, 14, 16, 18, 22, 30, 44)]
b14, b16, b18, b22, b30 = [font(s, True) for s in (14, 16, 18, 22, 30)]

ice = "#f6f8f7"
panel = "#ffffff"
line = "#dde5e2"
graphite = "#202927"
muted = "#6c7975"
green = "#123d33"
green2 = "#1f5f4f"
petrol = "#447982"
petrol_soft = "#e7f0f1"
red = "#b75555"
red_soft = "#f7eaea"

def rounded(xy, fill, outline=None, radius=8, width=1):
    draw.rounded_rectangle(xy, radius=radius, fill=fill, outline=outline, width=width)

def text(x, y, value, fill=graphite, ft=f16):
    draw.text((x, y), value, fill=fill, font=ft)

def card(x, y, w, h):
    rounded((x, y, x+w, y+h), panel, line)

# sidebar
draw.rectangle((0, 0, 280, H), fill="#fbfcfb", outline=line)
rounded((26, 26, 70, 70), green, radius=8)
text(43, 35, "F", "#ffffff", b22)
text(84, 29, "Financa Pessoal", graphite, b16)
text(84, 53, "Controle completo", muted, f14)

tabs = [
    ("D", "Dashboard Geral", True),
    ("+", "Controle Financeiro Geral", False),
    ("$", "Contas Bancarias", False),
    ("M", "Metas Financeiras", False),
    ("P", "Planejamento Mensal", False),
    ("!", "Controle de Dividas", False),
    ("12", "Resumo Anual", False),
]
y = 108
for icon, label, active in tabs:
    if active:
        rounded((18, y, 262, y+46), petrol_soft, radius=8)
    text(34, y+13, icon, petrol, b14)
    text(66, y+12, label, green if active else muted, b14 if active else f14)
    y += 54

# header
text(308, 31, "VISAO INTEGRADA", petrol, b14)
text(308, 55, "Dashboard Geral", graphite, f44)
rounded((1096, 36, 1228, 76), "#e9eeec", radius=8)
text(1118, 46, "Exportar JSON", green, b14)
rounded((1242, 36, 1388, 76), green, radius=8)
text(1264, 46, "Restaurar exemplo", "#ffffff", b14)

# metric cards
metrics = [
    ("Saldo consolidado", "R$ 43.430,00", "3 contas conectadas", graphite),
    ("Receitas do mes", "R$ 7.200,00", "Entradas confirmadas", graphite),
    ("Despesas do mes", "R$ 2.810,00", "Saidas confirmadas", graphite),
    ("Dividas em aberto", "R$ 10.000,00", "Acompanhe vencimentos", red),
]
x = 308
for label, value, hint, color in metrics:
    card(x, 126, 255, 128)
    text(x+20, 145, label, muted, f14)
    text(x+20, 178, value, color, b30)
    text(x+20, 219, hint, muted, f14)
    x += 271

# panels
card(308, 270, 542, 330)
text(328, 292, "Fluxo mensal", graphite, b18)
text(650, 294, "R$ 4.390,00 de resultado no mes", muted, f14)
months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago"]
vals = [0.35, 0.12, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0]
exps = [0.0, 0.09, 0.0, 0.0, 0.0, 0.39, 0.0, 0.0]
yy = 334
for m, v, e in zip(months, vals, exps):
    text(328, yy-4, m, muted, f14)
    rounded((386, yy, 705, yy+12), "#e9eeec", radius=7)
    rounded((386, yy, 386 + int(319*v), yy+12), petrol, radius=7)
    rounded((386, yy+17, 705, yy+29), "#e9eeec", radius=7)
    rounded((386, yy+17, 386 + int(319*e), yy+29), red, radius=7)
    result = "R$ 4.390,00" if m == "Jun" else ("R$ 1.600,00" if m == "Jan" else "R$ 0,00")
    text(724, yy+2, result, graphite, b14)
    yy += 34

card(866, 270, 255, 330)
text(886, 292, "Saude financeira", graphite, b18)
text(1062, 294, "100%", muted, f14)
draw.pieslice((914, 340, 1078, 504), 0, 360, fill=green)
draw.ellipse((948, 374, 1044, 470), fill=panel)
text(972, 407, "100%", graphite, b22)
text(896, 532, "Sua organizacao esta saudavel.", muted, f14)
text(896, 554, "Continue protegendo a reserva.", muted, f14)

card(1137, 270, 255, 330)
text(1157, 292, "Proximas acoes", graphite, b18)
actions = [
    "Direcionar parte do saldo",
    "positivo para metas.",
    "Revisar Cartao parcelado,",
    "vencimento em 18/06/2026.",
    "Acelerar Viagem, hoje em 32%.",
]
yy = 336
for a in actions:
    rounded((1157, yy, 1372, yy+34), "#f9fbfa", radius=8)
    text(1169, yy+8, a, graphite, f14)
    yy += 45

card(308, 616, 1084, 300)
text(328, 638, "Ultimos lancamentos", graphite, b18)
text(1270, 640, "Ver controle", petrol, b14)
cols = [("Data", 328), ("Categoria", 465), ("Conta", 650), ("Tipo", 870), ("Valor", 1030)]
for label, xx in cols:
    text(xx, 690, label.upper(), muted, b14)
draw.line((328, 720, 1368, 720), fill=line, width=1)
rows = [
    ("10/06/2026", "Transporte", "Banco Principal", "Despesa", "R$ 340,00", red),
    ("07/06/2026", "Mercado", "Banco Principal", "Despesa", "R$ 620,00", red),
    ("04/06/2026", "Moradia", "Banco Principal", "Despesa", "R$ 1.850,00", red),
    ("02/06/2026", "Salario", "Banco Principal", "Receita", "R$ 7.200,00", green2),
]
yy = 738
for row in rows:
    text(328, yy, row[0], graphite, f14)
    text(465, yy, row[1], graphite, f14)
    text(650, yy, row[2], graphite, f14)
    text(870, yy, row[3], graphite, f14)
    text(1030, yy, row[4], row[5], b14)
    draw.line((328, yy+32, 1368, yy+32), fill=line, width=1)
    yy += 47

img.save("preview-dashboard.png")
