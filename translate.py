import sys
import io

with open('src/app/[locale]/marketplace/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace texts
content = content.replace(">마켓플레이스</h1>", ">{t('title')}</h1>")
content = content.replace("새 상품등록 요청\n          </Link>", "{t('requestNew')}\n          </Link>")

content = content.replace(">쇼핑몰</button>", ">{t('shop')}</button>")
content = content.replace(">상품등록 요청</button>", ">{t('productRequest')}</button>")

content = content.replace(">전체</button>", ">{t('all')}</button>")

content = content.replace(">불러오는 중...</div>", ">{t('loading')}</div>")

content = content.replace("상품을 준비 중입니다. 필요한 상품이 있다면 상품등록 요청을 남겨주세요!", "{t('emptyShop')}")
content = content.replace(">이미지 없음</div>", ">{t('noImage')}</div>")

content = content.replace(">상품등록 신청하기</Link>", ">{t('requestButton')}</Link>")

content = content.replace(">등록된 요청이 없습니다.</h3>", ">{t('emptyRequestsTitle')}</h3>")
content = content.replace(">원하시는 치과 재료나 장비가 있다면 가장 먼저 입점 요청을 남겨보세요!</p>", ">{t('emptyRequestsDesc')}</p>")
content = content.replace("상품등록 요청하기\n                </Link>", "{t('requestButton')}\n                </Link>")

content = content.replace("req.status === 'LISTED' ? '입점 완료' : req.status === 'REVIEWING' ? '검토 중' : '수요 조사 중'", "req.status === 'LISTED' ? t('listed') : req.status === 'REVIEWING' ? t('reviewing') : t('surveying')")

content = content.replace("선호 브랜드: {req.preferredBrand || '무관'} | 예상 소요량/월: {req.quantity}{req.unit}", "{t('preferredBrand')}: {req.preferredBrand || t('any')} | {t('estQuantity')}: {req.quantity}{req.unit}")

content = content.replace(">나도 필요해요</span>", ">{t('iNeedThisToo')}</span>")

content = content.replace("alert('로그인이 필요합니다.');", "alert(t('loginReq'));")
content = content.replace("alert('공감했습니다.');", "alert('Success');") # skip this or translate if needed.

# Format JSX string properly for translation keys inside components
content = content.replace(
    ">쇼핑몰\n          </button>",
    ">{t('shop')}\n          </button>"
)
content = content.replace(
    ">상품등록 요청\n          </button>",
    ">{t('productRequest')}\n          </button>"
)
content = content.replace(
    ">전체\n        </button>",
    ">{t('all')}\n        </button>"
)


with open('src/app/[locale]/marketplace/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated marketplace/page.tsx')
